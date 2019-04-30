@Library('piper-library-os') _

node() {

  stage('prepare') {
    checkout scm
    setupCommonPipelineEnvironment script:this
    checkChangeInDevelopment script: this
  }

  stage('buildMta') {
    mtaBuild script: this
  }

  stage('uploadToTransportRequest') {
    transportRequestCreate script: this
    transportRequestUploadFile script:this
    transportRequestRelease script: this
  }

}
