'use strict';


var openmrsSettings = angular.module('openmrs-settings',[]);

openmrsSettings.factory('OpenmrsSettings', ['$injector',
  function ($injector) {
    var settings = {};
    settings.context = "http://etl1.ampath.or.ke:8080/amrs";
    settings.contextOptions =
      [
        "http://etl1.ampath.or.ke:8080/amrs",
        "https://amrs.ampath.or.ke:8443/amrs"
      ];

    settings.getContextOptions = function() {
      return settings.contextOptions;
    }

    settings.addContext = function(url) {
      settings.contextOptions.push(url);
    }

    settings.setContext = function(url) {
      settings.context = url;
      console.log(url);
      var Auth = $injector.get("Auth");
      Auth.authenticateOpenmrsContext(function(authenticated) {
        console.log('authenticated: ' + authenticated);
      })
      if(settings.contextOptions.indexOf(url) === -1) settings.addContext(url);
    }

    settings.getContext = function() {
      return settings.context;
    }
    return settings;
  }]);


var openmrsServices = angular.module('openmrs-services-extended', ['ngResource', 'ngCookies','openmrs-settings','data-manager']);

openmrsServices.factory('OpenmrsUtilityService', [
  function () {
    var util = {};

    util.getParam = function (uri, name) {
      var params = uri.substring(uri.indexOf('?')).split('&');
      var p = {};
      for (var i = 0; i < params.length; i++) {
        var pair = params[i];
        var t = pair.split('=');
        if (t[0] == name) {
          return t[1];
        }
      }
      return undefined;
    };

    util.getStartIndex = function (data) {
      var startIndex = undefined;
      if (data.links) {
        for (var i in data.links) {
          var l = data.links[i];
          if (l.rel == "next") {
            startIndex = this.getParam(l.uri, 'startIndex');
            break;
          }
        }
      }
      return startIndex;
    };


    return util;
  }]);


openmrsServices.factory('OpenmrsSessionService', ['$resource','OpenmrsSettings','DataManagerService',
  function ($resource,OpenmrsSettings,dataMgr) {
    var service = {};
    var OpenmrsSession;
    var url;

    function getResource() {
      var r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/session");
      return new dataMgr.ExtendedResource(r,false);
    }

    service.getSession = function (callback) {
      OpenmrsSession = getResource();
      console.log(OpenmrsSession);
      return OpenmrsSession.get({}
        ,function (data, status, headers) {
          console.log(data);
          data.online = true;
          callback(data);
        }
      );
    };

    service.logout = function (callback) {
      OpenmrsSession = $resource(url);
      return OpenmrsSession.delete({}, function (data, status, headers) {
      });
    }
    return service;
  }]);


openmrsServices.factory('PersonService', ['$resource','OpenmrsSettings','DataManagerService',
  function ($resource,OpenmrsSettings,dataMgr) {
    var service = {};
    var url, r, Person;
    var resourceName = "openmrs.person";

    /*
     * Extended Resource Settings
     * usesEncryption: true,
     * resourceName: openmrs.person
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */
    function getResource() {
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/person/:uuid",
        {uuid: '@uuid'},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource($resource,true,resourceName,true,'uuid',null);
    }

    service.get = function(uuid,callback) {
      Person = getResource();
      Person.get({"uuid":uuid},
        function(data) { callback(data);}
      );
    }
  }]);


openmrsServices.factory('ProviderService', ['OpenmrsSettings','DataManagerService',
  function (OpenmrsSettings,dataMgr) {
    var ProviderService = {};
    var Provider,r;
    var v = "custom:(uuid,identifier,person:ref)";
    var resourceName = "openmrs.provider";

    /*
     * Extended Resource Settings
     * usesEncryption: false,
     * resourceName: openmrs.provider
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */
    function getResource() {
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/provider/:uuid",
        {uuid: '@uuid', v: v},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource(r,true,resourceName,false,"uuid",null);
    }

    ProviderService.query = function (searchString,callback) {
      Provider = getResource();

      Provider.query(searchString,
        function (data) { callback(data.results); }
      );
    };


    return ProviderService;
  }]);



var Patient = function (patientData) {
  this.patientData = patientData;
};
Patient.prototype.getPatient = function () {
  return this.patientData;
};
Patient.prototype.getUuid = function () {
  return this.patientData.uuid;
};
Patient.prototype.getName = function () {
  return (this.patientData.person.preferredName.givenName || "") + " "
    + (this.patientData.person.preferredName.middleName || "") + " "
    + this.patientData.person.preferredName.familyName;
}
Patient.prototype.getGivenName = function () {
  return this.patientData.person.preferredName.givenName;
};
Patient.prototype.setGivenName = function (s) {
  return this.patientData.person.preferredName.givenName = s;
};

Patient.prototype.getFamily = function () {
  return this.patientData.person.preferredName.familyName;
};
Patient.prototype.setFamilyName = function (s) {
  return this.patientData.person.preferredName.familyName = s;
};

Patient.prototype.getMiddleName = function () {
  return this.patientData.person.preferredName.middleName;
};
Patient.prototype.setMiddleName = function (s) {
  return this.patientData.person.preferredName.middleName = s;
};

Patient.prototype.getBirthdate = function () {
  return this.patientData.person.birthdate;
};
Patient.prototype.getDead = function () {
  return this.patientData.person.dead
};
Patient.prototype.getDeathDate = function () {
  return this.patientData.person.deathDate
};
Patient.prototype.getGender = function () {
  return this.patientData.person.gender
};

Patient.prototype.getIdentifiers = function (identifierType) {
  return this.patientData.identifiers;
};
Patient.prototype.getPhoneNumber = function () {
  for (var i in this.patientData.person.attributes) {
    var attr = this.patientData.person.attributes[i];
    if (attr.attributeType.uuid == "72a759a8-1359-11df-a1f1-0026b9348838") {
      return attr.value;
    }
  }
}

Patient.prototype.getClinicalHome = function () {
  for (var i in this.patientData.person.attributes) {
    var attr = this.patientData.person.attributes[i];
    if (attr.attributeType.uuid == '8d87236c-c2cc-11de-8d13-0010c6dffd0f') {
      return attr.value;
    }
  }
  return "";
}


Patient.prototype.getAttributes = function () {
  return this.patientData.person.attributes;
}

//Converts an object in form of {typeUuuid:value} into rest format
Patient.prototype.setAttributes = function (newAttributes) {
  var existingAttrs = this.getAttributes();

  var value, restAttr, attr, found;
  for (var attrTypeUuid in newAttributes) {
    value = newAttributes[attrTypeUuid];
    restAttr = {attributeType: {uuid: attrTypeUuid}, value: value};
    found = false;
    console.log('finding: ' + attrTypeUuid);
    for (var j in existingAttrs) {
      attr = existingAttrs[j];
      if (attr.attributeType.uuid === attrTypeUuid) {
        console.log('found attribute, resetting to new value');
        found = true;
        existingAttrs[j] = restAttr;
        break;
      }
    }
    if (!found) {
      existingAttrs.push(restAttr);
    }
  }
}

openmrsServices.factory('PatientService', ['$resource','$http', 'OpenmrsSettings','DataManagerService',
  function ($resource,$http, OpenmrsSettings,dataMgr) {
    var PatientService = {};
    var PatientRes;
    var r, resourceName = "openmrs.patient";

    /*
     * Extended Resource Settings
     * usesEncryption: true,
     * resourceName: openmrs.patient
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */
    function getResource(){
      var v = "custom:(uuid,identifiers:ref,person:(uuid,gender,birthdate,dead,deathDate,preferredName:(givenName,middleName,familyName),"
        + "attributes:(uuid,value,attributeType:ref)))";
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/patient/:uuid",
        {uuid: '@uuid', v: v},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource(r,true,resourceName,true,"uuid",null);
    }

    PatientService.Patient = function (patientData) {
      return new Patient(patientData);
    }


    PatientService.get = function (patientUuid, callback) {
      console.log('uuid: ' + patientUuid);
      PatientRes = getResource();

      PatientRes.get({uuid:patientUuid},
        function (data) {
          var d = data;
          if (data.result) d = new Patient(data);
          callback(d);
        }
      );
    };

    PatientService.query = function(searchString,callback) {
      PatientRes = getResource();
      console.log(PatientRes);
      PatientRes.query(searchString,function(data) {callback(data);});
    }

    return PatientService;

  }]);


openmrsServices.factory('FormService', ['$resource','OpenmrsSettings','DataManagerService',
  function ($resource,OpenmrsSettings,dataMgr) {

    var service = {};
    var FormResource;
    var r, resourceName = "openmrs.form";
    /*
     * Extended Resource Settings
     * usesEncryption: true,
     * resourceName: openmrs.person
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */

    function getResource() {
      var v = "custom:(uuid,name,encounterType:(uuid,name))";
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/form/:uuid",
        {uuid: '@uuid', v: v},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource(r,true,resourceName,false,"uuid",null);
    }

    service.get = function(uuid,callback) {
      FormResource = getResource(url);
      FormResource.get({uuid:uuid},
        function(data) { callback(data);}
      );
    }
  }]);

openmrsServices.factory('ObsService', ['$resource', '$http','OpenmrsSettings','DataManagerService',
  function ($resource, $http,OpenmrsSettings,dataMgr) {
    var ObsService = {};
    var url, v, Obs;
    var r, resourceName = "openmrs.obs";

    /*
     * Extended Resource Settings
     * usesEncryption: true,
     * resourceName: openmrs.person
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */
    function getResource() {
      v = "custom:(uuid,concept:(uuid,uuid),groupMembers,value:ref)";
      url = OpenmrsSettings.getContext() + 'ws/rest/v1/obs/:uuid';
      r = $resource(url,
        {uuid: '@uuid', v: v},
        {query: {method: "GET", isArray: false}}
      )
      return new dataMgr.ExtendedResource(r,false);
    }


    ObsService.update = function (obsUuid, value, callback) {
      //var o = new Obs({uuid: obsUuid, value: value});
      Obs = getResource(url);
      Obs.save({uuid: obsUuid, value: value},
        function (data) {callback(data);}
      );
    };

    /*
     If the obs to be updated has a non-empty value, it will be updated.
     Otherwise, it will be voided.
     */
    ObsService.updateObsSet = function (obsToUpdate, callback) {
      var o;
      for (var i in obsToUpdate) {
        o = obsToUpdate[i];
        console.log('updating obs: ' + angular.toJson(o));
        if (o.value !== undefined && o.value !== "") {
          ObsService.update(o.uuid, o.value, callback);
        }
        else ObsService.remove(o.uuid, callback);
      }
    };

    //NOT CLEAR WHAT THIS IS SUPPOSED TO DO
    ObsService.updateGroupMembers = function (obsUuid, groupMembers, callback) {
    };

    ObsService.get = function (obsUuid, callback) {
      Obs = getResource();
      Obs.get({uuid:obsUuid},
        function (data) {callback(data);}
      );
    };

    ObsService.remove = function (obsUuid, callback) {
      Obs = getResource();
      Obs.remove(obsUuid,function (data) { callback(data); });
    }

    ObsService.voidObs = function (obsToVoid, callback) {
      for (var i in obsToVoid) {
        var uuid = obsToVoid[i];
        ObsService.remove(uuid, callback);
      }
    }

    return ObsService;
  }]);


openmrsServices.factory('EncounterService', ['$http', '$resource','OpenmrsSettings','DataManagerService',
  function ($http, $resource,OpenmrsSettings,dataMgr) {
    var EncounterService = {}, Encounter;
    var r, resourceName = "openmrs.encounter";
    /*
     * Extended Resource Settings
     * usesEncryption: true,
     * resourceName: openmrs.encounter
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */
    function getResource() {
      var v = "custom:(uuid,encounterDatetime,patient:(uuid,uuid),form:(uuid,name),location:ref";
      v += ",encounterType:ref,provider:ref,obs:(uuid,concept:(uuid,uuid),value:ref,groupMembers))";
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/encounter/:uuid",
        {uuid: '@uuid', v: v},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource(r,true,resourceName,true,"uuid",null);
    }

    EncounterService.get = function (encounterUuid, callback) {
      Encounter = getResource();
      Encounter.get(uuid,function (data) {callback(data);});
    };


    EncounterService.patientQuery = function (params, callback) {
      var v = "custom:(uuid,encounterDatetime,patient:(uuid,uuid),form:(uuid,name),location:ref";
      v += ",encounterType:ref,provider:ref)";
      params.v = v;
      Encounter = getResource();

      Encounter.get(params
        ,function (data) {callback(data);}
      );
    };

    //May be better to have one function patientQuery where calling function specifies as
    //a parameter if obs should be included
    EncounterService.patientQueryWithObs = function (params, callback) {
      Encounter.get(params,
        function (data) { callback(data);}
      );
    };


    EncounterService.submit = function (enc, callback) {
      var url = OpenmrsSettings.getContext() + '/ws/rest/v1/encounter/';
      if (enc.uuid) {
        url += enc.uuid;
      }
      delete enc.uuid;

      $http.post(url, enc)
        .success(function (data, status, headers, config) {
          callback(data);
          if (data.error) {
            console.log('EncounterService.submit() : error in rest response');
          }
        })
        .error(function (data, status, headers, config) {
          var error = {data:data,error:true};
          console.log("EncounterService.submit() : error:" + data);
          callback(error);
         });

    };
    return EncounterService;

  }]);


openmrsServices.factory('EncounterType', ['$resource','OpenmrsSettings',
  function ($resource,OpenmrsSettings) {
    return $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/encountertype/:uuid",
      {uuid: '@uuid'},
      {query: {method: "GET", isArray: false}}
    );
  }]);



openmrsServices.factory('LocationService', ['$resource', 'OpenmrsSettings','DataManagerService',
  function ($resource,OpenmrsSettings,dataMgr) {
    var LocationService = {},Location;
    var r, resourceName = "openmrs.location";
    /*
     * Extended Resource Settings
     * usesEncryption: false,
     * resourceName: openmrs.location,
     * primaryKey : "uuid"
     * queryFields : null=all (for now)
     */

    function getResource() {
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/location/:uuid",
        {uuid: '@uuid'},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource(r,true,resourceName,false,"uuid",null);
    }

    LocationService.query = function (searchString,callback) {
      Location = getResource();
      Location.query({q:searchString},
        function (data) { callback(data.results); },
        function(error) {callback({online:false,error:error});}
      );
    };

    return LocationService;

  }]);


openmrsServices.factory('Concept', ['$resource','OpenmrsSettings',
  function ($resource,OpenmrsSettings) {
    return $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/concept/:uuid",
      {uuid: '@uuid'},
      {query: {method: "GET", isArray: false}}
    );
  }]);


openmrsServices.factory('PersonAttribute', ['$resource','OpenmrsSettings',
  function ($resource,OpenmrsSettings) {
    return $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/person/:personUuid/attribute/:uuid", {},
      {
        query: {method: "GET", isArray: false},
      }
    );
  }]);


openmrsServices.factory('PersonAttributeService', ['$resource','OpenmrsSettings','DataManagerService',
  function ($resource, OpenmrsSettings,dataMgr) {
    var paService = {}, PersonAttribute;
    var r, resourceName = "openmrs.personAttribute";
    /*
     * Extended Resource Settings
     * usesEncryption: true,
     * resourceName: openmrs.person
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */

    function getResource() {
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/person/:personUuid/attribute/:uuid",
        {},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource(r,false);
    }

    paService.save = function (personUuid, attributeTypeUuid, value, callback) {
      //var pa = new PersonAttribute({attributeType: attributeTypeUuid, value: value});
      PersonAttribute = getResource();
      PersonAttribute.$resource.$save({personUuid: personUuid},
        function (data, status, headers) {
          if (callback) return callback(data);
          else return data;
        }
      );
    };

    return paService;

  }]);



openmrsServices.factory('OpenmrsUserService', ['$resource','OpenmrsSettings',
  function ($resource,OpenmrsSettings) {
    var OpenmrsUserService = {},OpenmrsUser;
    var r, resourceName = "openmrs.user";
    /*
     * Extended Resource Settings
     * usesEncryption: true,
     * resourceName: openmrs.person
     * primaryKey : "uuid"
     * queryFields : all (for now)
     */
    function getResource() {
      var v = "custom:(uuid,username,systemId,roles:(uuid,name,privileges))";
      r = $resource(OpenmrsSettings.getContext() + "/ws/rest/v1/user/:uuid",
        {uuid: '@uuid', v: v},
        {query: {method: "GET", isArray: false}}
      );
      return new dataMgr.ExtendedResource(r,true,resourceName,false,"uuid",null);
    }

    OpenmrsUserService.getRoles = function (username, callback) {
      OpenmrsUser = getResource();
      OpenmrsUser.get({username: username},
        function (data) { callback(data.results[0].roles); }
      );
    }

    //role can be either role uuid or name
    OpenmrsUserService.hasRole = function (username, role, callback) {
      OpenmrsUser = getResource();
      OpenmrsUser.get({username: username},
        function (data) {
          var hasRole = false;
          var roles = data.results[0].roles;
          if (roles) {
            for (var i in roles) {
              if (roles[i].uuid === role || roles[i].name.toLowerCase() === role.toLowerCase()) {
                hasRole = true;
                break;
              }
            }
          }
          callback(hasRole);
        }
      );
    }

    return OpenmrsUserService;
  }]);