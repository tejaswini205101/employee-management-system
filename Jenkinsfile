// Jenkinsfile — CI/CD pipeline for the Employee Management System
//
// Works on both Windows and Linux Jenkins agents/controllers: every stage
// checks isUnix() and runs the matching shell (sh on Linux/Mac, bat on
// Windows) so the same file works whether Jenkins is on your laptop or a
// Linux CI server later.
//
// Prerequisites on the Jenkins controller/agent:
//   - Python 3.12+, Node.js 20+, and Docker Desktop/Engine all installed
//     and available on PATH for whichever user runs Jenkins
//   - Credentials configured in Jenkins (Manage Jenkins > Credentials):
//       dockerhub-creds   -> Username/Password (Docker Hub access token as
//                            the password) for your registry
//   - A Pipeline job pointed at this repo (Script Path: Jenkinsfile), with
//     a GitHub webhook (repo Settings > Webhooks) calling:
//       http://<jenkins-host>:8080/github-webhook/
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
            script {
                if (isUnix()) {
                    sh '''
                        python3 -m pip install --upgrade pip
                        python3 -m pip install -r requirements.txt
                        python3 -m pytest --junitxml=test-results.xml
                    '''
                } else {
                    bat '''
                        py -m pip install --upgrade pip
                        py -m pip install -r requirements.txt
                        py -m pytest --junitxml=test-results.xml
                    '''
                }
            }
        }
    }
}

        stage('Frontend: Install & Build') {
            steps {
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh '''
                                npm install
                                npm run build
                            '''
                        } else {
                            bat '''
                                npm install
                                npm run build
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    if (isUnix()) {
                        sh """
                            docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./backend
                            docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend
                        """
                    } else {
                        bat """
                            docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest .\\backend
                            docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest .\\frontend
                        """
                    }
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    script {
                        if (isUnix()) {
                            sh """
                                echo "\$REG_PASS" | docker login -u "\$REG_USER" --password-stdin
                                docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                                docker push ${BACKEND_IMAGE}:latest
                                docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                                docker push ${FRONTEND_IMAGE}:latest
                            """
                        } else {
                            bat """
                                echo %REG_PASS%| docker login -u %REG_USER% --password-stdin
                                docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                                docker push ${BACKEND_IMAGE}:latest
                                docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                                docker push ${FRONTEND_IMAGE}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression {
                    return (env.GIT_BRANCH?.endsWith('main')) || (env.BRANCH_NAME == 'main')
                }
            }
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            export IMAGE_REGISTRY=$IMAGE_REGISTRY
                            docker compose -f docker-compose.prod.yml pull
                            docker compose -f docker-compose.prod.yml up -d --remove-orphans
                        '''
                    } else {
                        bat '''
                            set IMAGE_REGISTRY=%IMAGE_REGISTRY%
                            docker compose -f docker-compose.prod.yml pull
                            docker compose -f docker-compose.prod.yml up -d --remove-orphans
                        '''
                    }
                }
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
            script {
                if (isUnix()) {
                    sh 'docker logout || true'
                } else {
                    bat 'docker logout || exit 0'
                }
            }
        }
    }
}