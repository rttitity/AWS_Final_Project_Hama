pipeline {
    agent any
    environment {
        GITNAME = 'rttitity'
        GITMAIL = 'jinwoo25803@gmail.com'
        GITWEBADD = 'https://github.com/rttitity/AWS_Final_Project_Hama.git'        // 소스코드 레포지토리 주소
        GITSSHADD = 'git@github-hama-web:rttitity/manifast-hama-web.git'                 // 매니페스트 레포지토리 주소 (https 안댐)
        GITCREDENTIAL = 'zinucha_git_cre'
        ECR_REPO = '756266714368.dkr.ecr.ap-northeast-2.amazonaws.com/hama-web'     // ECR 레포지토리 주소
        AWS_CREDENTIAL = 'zinucha_aws'                                              // AWS 크레덴셜
    }
    stages {
        // git clone stage
        stage('Checkout Github') {
            steps {
                    slackSend (
                    channel: '#velocity-cicd',
                    color: '#800080',
                    message: "STARTED: ${currentBuild.number}"
                )
                checkout([$class: 'GitSCM', branches: [[name: '*/main']], extensions: [],
                userRemoteConfigs: [[credentialsId: GITCREDENTIAL, url: GITWEBADD]]])
            }
            post {
                failure {
                    sh "echo clone failed"
                }
                success {
                    sh "echo clone success"
                }
            }
        }

        // 도커 이미지 빌드 stage
        stage('docker image build') {
            steps {
                sh "docker build -t ${ECR_REPO}:${currentBuild.number} ."
                sh "docker build -t ${ECR_REPO}:latest ."
                // currentBuild.number 젠킨스가 제공하는 빌드넘버 변수
            }
            post {
                failure {
                    sh "echo image build failed"
                }
                success {
                    sh "echo image build success"
                }
            }
        }

        // 도커 이미지 푸시 stage (AWS ECR로 푸시)
        stage('docker image push') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: AWS_CREDENTIAL]]) {
                    // ECR에 로그인
                    sh "aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin ${ECR_REPO}"
                    // 이미지 푸시
                    sh "docker push ${ECR_REPO}:${currentBuild.number}"
                    sh "docker push ${ECR_REPO}:latest"
                }
            }
            post {
                failure {
                    sh "docker image rm -f ${ECR_REPO}:${currentBuild.number}"
                    sh "docker image rm -f ${ECR_REPO}:latest"
                    sh "echo push failed"
                }
                success {
                    sh "docker image rm -f ${ECR_REPO}:${currentBuild.number}"
                    sh "docker image rm -f ${ECR_REPO}:latest"
                    sh "echo push success"
                }
            }
        }

        // EKS 매니페스트 파일 업데이트 stage
        stage('EKS manifest file update') {
            steps {
                git credentialsId: GITCREDENTIAL, url: GITSSHADD, branch: 'main'
                sh "git config --global user.email ${GITMAIL}"
                sh "git config --global user.name ${GITNAME}"
        
                // sed 명령어로 파일 수정
                sh "sed -i 's@${ECR_REPO}:.*@${ECR_REPO}:${currentBuild.number}@g' dep-hama-web.yml"
        
                // 변경된 파일 확인
                sh "cat dep-hama-web.yml"
        
                // 변경 사항 스테이징
                sh "git add dep-hama-web.yml"
        
                // git 상태 확인
                sh "git status"
        
                // 커밋
                sh "git commit -m 'fixed tag ${currentBuild.number}'"
                sh "git push origin main"
            }
        }


        // EKS 매니페스트 파일 업데이트 stage
        stage('send slack success') {
            steps {
                slackSend (
                channel: '#velocity-cicd',
                color: '#800080',
                message: "SUCCESS: ${currentBuild.number} hama-web CI/CD!! YaTTA!!"
                )
            }
            
        }
    }
}
// CI/CD test
