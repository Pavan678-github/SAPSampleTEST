sap.ui.define([
	"sap/ui/core/util/MockServer"
], function(MockServer) {
	"use strict";
	var oMockServer,
		_sAppModulePath = "nw.epm.refapps.st.prod.manage/";
	return {

		/**
		 * Initializes the mock server.
		 * You can configure the delay with the URL parameter "serverDelay".
		 * The local mock data in this folder is returned instead of the real data for testing.
		 * @public
		 */

		init: function() {
			var sManifestUrl = jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json"),
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oDataSource = oManifest["sap.app"].dataSources;

			for (var sDataSourceName in oDataSource) {
				if (oDataSource[sDataSourceName].type === "OData") {
					this.createMockServer(oDataSource, sDataSourceName);
				}
			}

		},

		createMockServer: function(oDataSource, sDataSourceName) {
			var oUriParameters = jQuery.sap.getUriParameters(),
				// sManifestUrl = jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json"),
				sEntity = oUriParameters.get("errorEntitySet"),
				sErrorParam = oUriParameters.get("errorType"),
				iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
				// oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				oMainDataSource = oDataSource[sDataSourceName],
				sMetadataUrl = jQuery.sap.getModulePath(_sAppModulePath + oMainDataSource.settings.localUri.replace(".xml", ""), ".xml"),
				sMockServerPath = sMetadataUrl.slice(0, sMetadataUrl.lastIndexOf("/") + 1),
				// ensure there is a trailing slash
				sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
				aAnnotations = oMainDataSource.settings.annotations || [];

			oMockServer = new MockServer({
				rootUri: sMockServerUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 1)
			});

			// load local mock data
			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sMockServerPath,
				bGenerateMissingMockData: true
			});

			var aRequests = oMockServer.getRequests(),
				//oRequests = new MockRequests(oMockServer),
				fnResponse = function(iErrCode, sMessage, aRequest) {
					aRequest.response = function(oXhr) {
						oXhr.respond(iErrCode, {
							"Content-Type": "text/plain;charset=utf-8"
						}, sMessage);
					};
				};

			// handling the metadata error test
			if (oUriParameters.get("metadataError")) {
				aRequests.forEach(function(aEntry) {
					if (aEntry.path.toString().indexOf("$metadata") > -1) {
						fnResponse(500, "metadata Error", aEntry);
					}
				});
			}

			// Handling request errors
			if (sErrorParam) {
				aRequests.forEach(function(aEntry) {
					if (aEntry.path.toString().indexOf(sEntity) > -1) {
						fnResponse(iErrorCode, sErrorParam, aEntry);
					}
				});
			}

			// add the local request handlers to the mock server (for requests that can not be handled automatically by the mock server)
			//oMockServer.setRequests(aRequests.concat(oRequests.getRequests()));
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");

			//create mock servers to handle the get requests for the annotation files (one for each data source defined in the manifest) 
			aAnnotations.forEach(function(sAnnotationName) {
				var oAnnotation = oDataSource[sAnnotationName],
					sUri = oAnnotation.uri,
					sLocalUri = jQuery.sap.getModulePath(_sAppModulePath + oAnnotation.settings.localUri.replace(".xml", ""), ".xml");

				///annotations
				new MockServer({
					rootUri: sUri,
					requests: [{
						method: "GET",
						path: new RegExp(".*"),
						response: function(oXhr) {
							jQuery.sap.require("jquery.sap.xml");

							var oAnnotations = jQuery.sap.sjax({
								url: sLocalUri,
								dataType: "xml"
							}).data;

							oXhr.respondXML(200, {}, jQuery.sap.serializeXML(oAnnotations));
							return true;
						}
					}]

				}).start();
			});
		}
	};

});