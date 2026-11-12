
pipeline {
    agent any

    tools {
        nodejs 'NodeJS22'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                // Vitest exige Node >= 22.12 (NodeJS22 del CI).
                sh 'npm run test:ci'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'coverage/junit.xml'
            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
        }
    }
}
