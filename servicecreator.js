function createServiceMixin (execlib, vararglib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry,
    genericDependentMethodCreator = vararglib.genericDependentMethodCreator,
    genfns = {
      getCandidates: genericDependentMethodCreator('getCandidates', 3),
      initiateRelation: genericDependentMethodCreator('initiateRelation', 2),
      getInitiators: genericDependentMethodCreator('getInitiators', 1),
      getMatches: genericDependentMethodCreator('getMatches', 1),
      blockRelation: genericDependentMethodCreator('blockRelation', 2),
      acceptRelation: genericDependentMethodCreator('acceptRelation', 2),
      fetchProfile: genericDependentMethodCreator('fetchProfile', 1),
    };

  function RWCHotelServiceMixin (prophash) {
    execSuite.RemoteServiceListenerServiceMixin.checkForImplementation(this);
    if (lib.isArray(prophash.rwcs)) {
      prophash.rwcs.forEach(findRemoter.bind(null, this));
    }
  }
  RWCHotelServiceMixin.prototype.destroy = function () {
  };

  function findRemoter (hotel, rwc) {
    if (!(rwc && rwc.path && rwc.name)) {
      throw new lib.Error('INVALID_RWC_DESCRIPTOR', 'RWC descriptor must be an Object with properties "path" and "name"');
    }
    hotel.findRemote(rwc.path, null, rwc.name);
  }

  RWCHotelServiceMixin.addMethods = function (klass, rwccodename) {
    var rlygetcndtsonname = 'reallyGetCandidatesOn'+rwccodename,
      fetchprofonname = 'fetchProfileOn'+rwccodename,
      mkfilt1onname = 'makeFilter1On'+rwccodename,
      mkfilt2onname = 'makeFilter2On'+rwccodename,
      lastrwcevntonname = 'lastRWCEventOn'+rwccodename;

    klass.prototype[rlygetcndtsonname] = execSuite.dependentServiceMethod([], [rwccodename], genfns.getCandidates);

    klass.prototype['initiateRelationOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], genfns.initiateRelation);

    klass.prototype['blockRelationOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], genfns.blockRelation);

    klass.prototype['acceptRelationOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], genfns.acceptRelation);

    klass.prototype['getInitiatorsOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], genfns.getInitiators);

    klass.prototype['getMatchesOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], genfns.getMatches);

    klass.prototype[fetchprofonname] = execSuite.dependentServiceMethod([], [rwccodename], genfns.fetchProfile);

    klass.prototype['getCandidatesOn'+rwccodename] = function (username, filter) {
      var errstring;
      if (!lib.isFunction(this[mkfilt1onname])) {
        errstring = this.constructor.name+' does not have the method '+mkfilt1onname+'(askerfilter, askerprofile) implemented';
        console.error(errstring);
        return q.reject('METHOD_NOT_IMPLEMENTED', errstring);
      }
      if (!lib.isFunction(this[mkfilt2onname])) {
        errstring = this.constructor.name+' does not have the method '+mkfilt2onname+'(askerfilter, askerprofile) implemented';
        console.error(errstring);
        return q.reject('METHOD_NOT_IMPLEMENTED', errstring);
      }
      try {
        return this[fetchprofonname](username).then(
          twoFiltersGetter.bind(this, mkfilt1onname, mkfilt2onname, filter)
        ).then(
          filters => {
            return this[rlygetcndtsonname](username, filters[0], filters[1]);
          }
        );
      } catch (e) {
        return q.reject(e);
      }
    };
    klass.prototype['onRWCSinkOn'+rwccodename] = function (rwcsink) {
      taskRegistry.run('readState', {
        state: taskRegistry.run('materializeState', {
          sink: rwcsink
        }),
        name: 'lastRWCEvent',
        cb: this.state.set.bind(this.state, lastrwcevntonname)
      });
    };
  };

  //virtual statics
  function twoFiltersGetter (mkfilt1onname, mkfilt2onname, filter, userprofile) {
    var ret = q.all([
      this[mkfilt1onname](filter, userprofile),
      this[mkfilt2onname](filter, userprofile)
    ]);
    mkfilt1onname = null;
    mkfilt2onname = null;
    filter = null;
    return ret;
  }

  return RWCHotelServiceMixin;
}
module.exports = createServiceMixin;

