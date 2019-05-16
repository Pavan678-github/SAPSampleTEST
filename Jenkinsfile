#!groovy

import com.sap.piper.Utils
import com.sap.piper.ConfigurationLoader
import com.sap.piper.ConfigurationMerger
def PACKAGE = '''$SAP_DEMO'''
def COVERAGE = 80
def VARIANT = "DEFAULT"
/**
 *	Copyright (c) 2017 SAP SE or an SAP affiliate company.  All rights reserved.
 *
 *	This software is the confidential and proprietary information of SAP
 *	("Confidential Information"). You shall not disclose such Confidential
 *	Information and shall use it only in accordance with the terms of the
 *	license agreement you entered into with SAP.
*/

@Library('piper-library-os') _

CONFIG_FILE_PROPERTIES = '.pipeline/config.properties'
CONFIG_FILE_YML = '.pipeline/config.yml'

node() {
  //Global variables:
  APP_PATH = 'src'
  SRC = "${WORKSPACE}/${APP_PATH}"

  def CONFIG_FILE
  

  //git poll: true, branch: BRANCH, url: GITURL
        		
  def STEP_CONFIG_NEO_DEPLOY='neoDeploy'
  def STEP_CONFIG_MTA_BUILD='mtaBuild'
  def LABEL = "NPL"
  def HOST = "vhcals4hci.dummy.nodomain"
  def CREDENTIAL = "NPL"
        	
        	
        	
        	def sap_pipeline = load "src/sap.groovy"
  stage("Clone sources and setup environment"){
    deleteDir()
    Map neoDeployConfiguration, mtaBuildConfiguration
    dir(APP_PATH) {
      checkout scm
      if(fileExists(CONFIG_FILE_YML) ) {
          CONFIG_FILE = CONFIG_FILE_YML
      } else if(fileExists (CONFIG_FILE_PROPERTIES) ) {
          CONFIG_FILE = CONFIG_FILE_PROPERTIES
      } else {
          error "No config file found."
      }
      echo "[INFO] using configuration file '${CONFIG_FILE}'."
      setupCommonPipelineEnvironment script: this, configFile: CONFIG_FILE
      prepareDefaultValues script: this
      neoDeployConfiguration = ConfigurationMerger.merge([:], (Set)[],
                                                         ConfigurationLoader.stepConfiguration(this, STEP_CONFIG_NEO_DEPLOY), (Set)['neoHome', 'account'],
                                                         ConfigurationLoader.defaultStepConfiguration(this, 'neoDeploy'))
      mtaBuildConfiguration = ConfigurationMerger.merge([:], (Set)[],
                                                        ConfigurationLoader.stepConfiguration(this, STEP_CONFIG_MTA_BUILD), (Set)['mtaJarLocation'],
                                                        ConfigurationLoader.defaultStepConfiguration(this, 'mtaBuild'))
    }
    MTA_JAR_LOCATION = mtaBuildConfiguration.mtaJarLocation ?: commonPipelineEnvironment.getConfigProperty('MTA_HOME')
    NEO_HOME = neoDeployConfiguration.neoHome ?: commonPipelineEnvironment.getConfigProperty('NEO_HOME')
    proxy =  ''
    httpsProxy =  ''
  }

  stage("Build Fiori App"){
    dir(SRC){
      withEnv(["http_proxy=${proxy}", "https_proxy=${httpsProxy}"]) {
        mtaBuild script: this, mtaJarLocation: MTA_JAR_LOCATION, buildTarget: 'NEO'
      }
    }
  }
  
  parallel (
    "Unit Tests":{
        
        	
      try{
        	sap_pipeline.abap_unit(LABEL,HOST,CREDENTIAL,PACKAGE,COVERAGE)
        	
      }
      catch(Exception e){}
        
    },
  "API Tests":{
        
        	
      try{
        	sap_pipeline.sap_api_test(LABEL,HOST,CREDENTIAL)
      }
      catch(Exception e){}
        
    },
  "Code Scan":{
        
        	
      try{
        	
        	sap_pipeline.abap_sci(LABEL,HOST,CREDENTIAL,PACKAGE,VARIANT)
      }
      catch(Exception e){}
        
    })
 

  stage("Deploy Fiori App"){
    dir(SRC){
      withEnv(["http_proxy=${proxy}", "https_proxy=${httpsProxy}"]) {
        neoDeploy script: this, neoHome: NEO_HOME
      }
    }
  }
}
