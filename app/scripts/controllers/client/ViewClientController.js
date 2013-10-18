(function(module) {
  mifosX.controllers = _.extend(module, {
    ViewClientController: function(scope, routeParams , route, location, resourceFactory, http) {
        scope.client = [];
        scope.identitydocuments = [];
        scope.buttons = [];
        scope.clientdocuments = [];

        resourceFactory.clientResource.get({clientId: routeParams.id} , function(data) {
            scope.client = data;
            if (data.imagePresent) {
              http({
                method:'GET',
                url: 'https://demo.openmf.org/mifosng-provider/api/v1/clients/'+routeParams.id+'/images'
              }).then(function(imageData) {
                scope.image = imageData.data;
              });
            }
            if (data.status.value == "Pending") {
              scope.buttons = [{
                                name:"button.edit",
                                href:"#/editclient",
                                icon :"icon-edit"
                              },
                              {
                                name:"button.activate",
                                href:"#/client",
                                subhref:"activate",
                                icon :"icon-ok-sign"
                              },
                              {
                                name:"button.delete",
                                href:"#/client",
                                subhref:"delete",
                                icon :"icon-warning-sign"
                              },
                              {
                                name:"button.close",
                                href:"#/client",
                                subhref:"close",
                                icon :"icon-remove-circle"
                              }]
                            
              }

            if (data.status.value == "Active") {
              scope.buttons = [{
                                name:"button.edit",
                                href:"#/editclient",
                                icon :"icon-edit"
                              },
                              {
                                name:"button.newloan",
                                href:"#/newclientloanaccount",
                                icon :"icon-plus"
                              },
                              {
                                name:"link.new.savings.application",
                                href:"#/new_client_saving_application",
                                icon :"icon-plus"
                              },
                              {
                                name:"button.transferclient",
                                href:"#/transferclient",
                                icon :"icon-arrow-right"
                              },
                              {
                                name:"button.close",
                                href:"#/client",
                                subhref:"close",
                                icon :"icon-remove-circle"
                              }]
            }

            if (data.status.value == "Pending" || data.status.value == "Active"){
              if(data.staffId) {
                scope.buttons.push({
                  name:"button.unassignstaff",
                  href:"#/client",
                  subhref:"unassignstaff?staffId="+data.staffId,
                  icon :"icon-user"
                });
              } else {
                scope.buttons.push({
                  name:"button.assignstaff",
                  href:"#/client",
                  subhref:"assignstaff",
                  icon :"icon-user"
                });
              }
            }

          resourceFactory.runReportsResource.get({reportSource: 'ClientSummary',genericResultSet: 'false',R_clientId: routeParams.id} , function(data) {
            scope.client.ClientSummary = data[0];
          });
        });

        resourceFactory.clientAccountResource.get({clientId: routeParams.id} , function(data) {
            scope.clientAccounts = data;
        });

        resourceFactory.clientNotesResource.getAllNotes({clientId: routeParams.id} , function(data) {
            scope.clientNotes = data;
        });
        scope.getClientIdentityDocuments = function () {
          resourceFactory.clientResource.getAllClientDocuments({clientId: routeParams.id, anotherresource: 'identifiers'} , function(data) {
              scope.identitydocuments = data;
              for(var i = 0; i<scope.identitydocuments.length; i++) {
                resourceFactory.clientIdentifierResource.get({clientIdentityId: scope.identitydocuments[i].id} , function(data) {
                  for(var j = 0; j<scope.identitydocuments.length; j++) {
                     if(data.length > 0 && scope.identitydocuments[j].id == data[0].parentEntityId)
                      {
                        scope.identitydocuments[j].documents = data;
                      }
                  }
                });
              }
          });
        };

        scope.getClientTemplateDocuments = function() {
          resourceFactory.templateResource.get({entityId : 0, typeId : 0}, function(data) {
            scope.clientTemplateData = data;
          })
        }

        resourceFactory.DataTablesResource.getAllDataTables({apptable: 'm_client'} , function(data) {
          scope.clientdatatables = data;
        });

        scope.dataTableChange = function(clientdatatable) {
          resourceFactory.DataTablesResource.getTableDetails({datatablename: clientdatatable.registeredTableName,
          entityId: routeParams.id, genericResultSet: 'true'} , function(data) {
            scope.datatabledetails = data;
            scope.datatabledetails.isData = data.data.length > 0 ? true : false;
            scope.datatabledetails.isMultirow = data.columnHeaders[0].columnName == "id" ? true : false;

            for(var i in data.columnHeaders) {
              if (scope.datatabledetails.columnHeaders[i].columnCode) {
                for (var j in scope.datatabledetails.columnHeaders[i].columnValues){
                  for(var k in data.data) {
                    if (data.data[k].row[i] == scope.datatabledetails.columnHeaders[i].columnValues[j].id) {
                      data.data[k].row[i] = scope.datatabledetails.columnHeaders[i].columnValues[j].value;
                    }
                  }
                }
              } 
            }

          });
        };

        scope.deleteAll = function (apptableName, entityId) {
          resourceFactory.DataTablesResource.delete({datatablename:apptableName, entityId:entityId, genericResultSet:'true'}, {}, function(data){
            route.reload();
          });
        };

        scope.getClientDocuments = function () {
          resourceFactory.clientDocumentsResource.getAllClientDocuments({clientId: routeParams.id} , function(data) {
            scope.clientdocuments = data;
          });
        };

        scope.deleteDocument = function (documentId, index) {
          resourceFactory.clientDocumentsResource.delete({clientId: routeParams.id, documentId: documentId}, '', function(data) {
            scope.clientdocuments.splice(index,1);
          });
        };

        scope.downloadDocument = function(documentId) {

        };

        scope.isNotClosed = function(loanaccount) {
          if(loanaccount.status.code === "loanStatusType.closed.written.off" || 
            loanaccount.status.code === "loanStatusType.rejected") {
            return false;
          } else{
             return true;
          }
           
        };

        scope.isClosed = function(loanaccount) {
          if(loanaccount.status.code === "loanStatusType.closed.written.off" || 
            loanaccount.status.code === "loanStatusType.rejected") {
            return true;
          } else{
             return false;
          }
        };


        scope.saveNote = function() {   
            resourceFactory.clientResource.save({clientId: routeParams.id, anotherresource: 'notes'}, this.formData , function(data){
            var today = new Date();
            temp = { id: data.resourceId , note : scope.formData.note , createdByUsername : "test" , createdOn : today } ;
            scope.clientNotes.push(temp);
            scope.formData.note = "";
            scope.predicate = '-id';
          });
        }

        scope.deleteClientIdentifierDocument = function (clientId, entityId, index){
          resourceFactory.clientIdenfierResource.delete({clientId: clientId, id: entityId}, '', function(data) {
            scope.identitydocuments.splice(index,1);
          });
        };

        scope.downloadClientIdentifierDocument=function (identifierId, documentId){
          console.log(identifierId,documentId);
        };

		// *********************** InVenture controller ***********************
        scope.fetchInventureScore = function(){
          // dummy data for the graph - DEBUG purpose
          var inventureScore = getRandomInt(450,800);
          var natAverage = getRandomInt(450,800);
          var industryAverage = getRandomInt(450,800);
          var inventureMinScore = 300;
          var inventureMaxScore = 850;

          // dummy data for inventure loan recommendation - DEBUG purpose
          scope.inventureAgricultureLimit = '21,000';
          scope.inventureFishermenLimit = '27,500';
          scope.inventureHousingLimit = '385,000';
          scope.inventureBusinessLimit = '10,000';

          // this part is used to generate data to see the look of the graph
          function getRandomInt (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
          }

          // CHART1 - comparison chart control
          var comparisonData = [
            {
              key: "Score Comparison",
                values: [
                  { 
                    "label" : "National Average",
                    "value" : (natAverage)
                  }, 
                  { 
                    "label" : "Industry Average", 
                    "value" : (industryAverage)
                  }, 
                  { 
                    "label" : "This Client", 
                    "value" : (inventureScore)
                  }
                ]
              }
            ];

          // add the comparison chart to the viewclient.html
          nv.addGraph(function() {
            var comparisonChart = nv.models.discreteBarChart()
              .x(function(d) { return d.label })
              .y(function(d) { return d.value })
              .staggerLabels(true)
              .tooltips(true)
              .showValues(true);
                
            // set all display value to integer
            comparisonChart.yAxis.tickFormat(d3.format('d'));
            comparisonChart.valueFormat(d3.format('d'));
            comparisonChart.forceY([inventureMinScore, inventureMaxScore]);

            d3.select('#inventureBarChart svg')
              .datum(comparisonData)
              .transition().duration(1500)
              .call(comparisonChart);

            nv.utils.windowResize(comparisonChart.update);
            return comparisonChart;
          });

          // CHART2 - inventure score bullet chart control
          nv.addGraph(function() {  
            var bullet = nv.models.bulletChart()
              .tooltips(false);

            d3.select('#inventureBulletChart svg')
              .datum(scoreData())
              .transition().duration(1500)
              .call(bullet);

            nv.utils.windowResize(bullet.update);
            return bullet;
          });

          function scoreData() {
            return {
              "title": "",
              "ranges": [(inventureMinScore - 300), (inventureMaxScore - 300)],
              "measures": [(inventureScore - 300)],
              "markers": [(inventureScore - 300)]};	
          }

          // this will be used to display the score on the viewclient.html
          scope.inventureScore = inventureScore;
        };
    }
  });
  mifosX.ng.application.controller('ViewClientController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', mifosX.controllers.ViewClientController]).run(function($log) {
    $log.info("ViewClientController initialized");
  });
}(mifosX.controllers || {}));
