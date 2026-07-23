// Jenkinsfile — CI/CD pipeline for the Employee Management System
//
// Prerequisites on the Jenkins controller/agent:
//   - Docker installed and the Jenkins user added to the "docker" group
//   - Credentials configured in Jenkins (Manage Jenkins > Credentials):
//       dockerhub-creds   -> Username/Password (or token) for your registry
//   - A multibranch pipeline or a regular pipeline job pointed at this repo,
//     with a GitHub webhook (Settings > Webhooks) calling:
//       http://<jenkins-host>/github-webhook/
//     so pushes to GitHub trigger a build automatically.

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    parameters {
        string(name: 'IMAGE_REGISTRY', defaultValue: 'yourdockerhubuser', description: 'Docker registry/namespace to push images to')
    }

    environment {
        BACKEND_IMAGE  = "${params.IMAGE_REGISTRY}/ems-backend"
        FRONTEND_IMAGE = "${params.IMAGE_REGISTRY}/ems-frontend"
        IMAGE_TAG      = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend: Install & Test') {
            steps {
                dir('backend') {
                    sh '''
                        python3 -m venv .venv
                        . .venv/bin/activate
                        pip install --upgrade pip
                        pip install -r requirements.txt
                        pytest --junitxml=test-results.xml
                    '''
                }
            }
            post {
                always {
                    junit 'backend/test-results.xml'
                }
            }
        }

        stage('Frontend: Install & Build') {
            steps {
                dir('frontend') {
                    sh '''
                        npm install
                        npm run build
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh """
                    docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./backend
                    docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend
                """
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    sh """
                        echo "\$REG_PASS" | docker login -u "\$REG_USER" --password-stdin
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                // Simplest option: redeploy the compose stack on this host/agent.
                // For a remote server, swap this for an SSH step or a
                // Kubernetes/Ansible deploy instead.
                sh '''
                    export IMAGE_REGISTRY=$IMAGE_REGISTRY
                    docker compose -f docker-compose.prod.yml pull
                    docker compose -f docker-compose.prod.yml up -d --remove-orphans
                '''
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} succeeded and images were pushed as tag ${IMAGE_TAG}."
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} failed — check the stage logs above."
        }
        always {
            sh 'docker logout || true'
        }
    }
}
