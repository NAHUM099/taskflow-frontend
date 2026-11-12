import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeUser, makeUserPage } from "@/test/factories";
import { renderWithProviders } from "@/test/render";
import { UsersContent } from "./UsersContent";

const { useUsersMock, refetchMock } = vi.hoisted(() => ({
  useUsersMock: vi.fn(),
  refetchMock: vi.fn(),
}));

vi.mock("@/hooks/queries/useUsers", () => ({ useUsers: useUsersMock }));

interface QueryResult {
  data?: ReturnType<typeof makeUserPage>;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
}

function stubQuery({
  data,
  isLoading = false,
  isError = false,
  isFetching = false,
}: QueryResult) {
  useUsersMock.mockReturnValue({
    data,
    isLoading,
    isError,
    isFetching,
    refetch: refetchMock,
  });
}

describe("UsersContent", () => {
  beforeEach(() => {
    refetchMock.mockReset();
  });

  it("lista los usuarios de la página", () => {
    stubQuery({
      data: makeUserPage({
        content: [
          makeUser({ id: 1, name: "Ana Torres" }),
          makeUser({ id: 2, name: "Luis Pérez", email: "luis@taskflow.dev" }),
        ],
      }),
    });

    renderWithProviders(<UsersContent />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
  });

  it("usa page 0, size 10 y sin búsqueda al inicio", () => {
    stubQuery({ data: makeUserPage() });

    renderWithProviders(<UsersContent />);

    expect(useUsersMock).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      search: undefined,
    });
  });

  it("debouncea la búsqueda 350 ms y vuelve a la primera página", async () => {
    stubQuery({
      data: makeUserPage({ totalPages: 3, number: 1, first: false, last: false }),
    });
    const user = userEvent.setup();

    renderWithProviders(<UsersContent />);

    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    await waitFor(() =>
      expect(useUsersMock).toHaveBeenLastCalledWith({
        page: 2,
        size: 10,
        search: undefined,
      }),
    );

    await user.type(screen.getByLabelText("Buscar usuarios"), "ana");

    await waitFor(
      () =>
        expect(useUsersMock).toHaveBeenLastCalledWith({
          page: 0,
          size: 10,
          search: "ana",
        }),
      { timeout: 2000 },
    );
  });

  it("no reinicia la paginación si la búsqueda no cambia", async () => {
    stubQuery({
      data: makeUserPage({ totalPages: 3, number: 1, first: false, last: false }),
    });
    const user = userEvent.setup();

    renderWithProviders(<UsersContent />);

    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    await waitFor(() =>
      expect(useUsersMock).toHaveBeenLastCalledWith({
        page: 2,
        size: 10,
        search: undefined,
      }),
    );

    // Deja pasar el debounce de montaje (350 ms) y comprueba que no vuelve a page 0.
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(useUsersMock).toHaveBeenLastCalledWith({
      page: 2,
      size: 10,
      search: undefined,
    });
  });

  it("muestra el error y permite reintentar", async () => {
    stubQuery({ isError: true });
    const user = userEvent.setup();

    renderWithProviders(<UsersContent />);
    expect(
      screen.getByText("No pudimos cargar los usuarios."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reintentar/ }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("oculta la paginación cuando hay una sola página", () => {
    stubQuery({ data: makeUserPage({ totalPages: 1 }) });

    renderWithProviders(<UsersContent />);

    expect(screen.queryByText(/Página 1 de/)).not.toBeInTheDocument();
  });

  it("muestra la paginación cuando hay varias páginas", () => {
    stubQuery({
      data: makeUserPage({ totalPages: 3, number: 1, first: false, last: false }),
    });

    renderWithProviders(<UsersContent />);

    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
  });

  it("abre el modal de edición al pulsar editar", async () => {
    stubQuery({
      data: makeUserPage({ content: [makeUser({ name: "Ana Torres" })] }),
    });
    const user = userEvent.setup();

    renderWithProviders(<UsersContent />);
    await user.click(
      screen.getByRole("button", { name: "Editar usuario Ana Torres" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Editar usuario" }),
    ).toBeInTheDocument();
  });

  it("filtra por búsqueda y muestra el vacío correspondiente", async () => {
    stubQuery({ data: makeUserPage({ content: [] }) });
    const user = userEvent.setup();

    renderWithProviders(<UsersContent />);
    expect(screen.getByText("No hay usuarios registrados.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Buscar usuarios"), "xyz");

    expect(
      await screen.findByText(
        "No se encontraron usuarios para tu búsqueda.",
        undefined,
        { timeout: 2000 },
      ),
    ).toBeInTheDocument();
  });
});
