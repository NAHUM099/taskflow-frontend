pipeline {
    agent any

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'npm run build'
            }
        }
    }
}