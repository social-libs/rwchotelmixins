function createServiceMixin (execlib, vararglib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry,
    genericDependentMethodCreator = vararglib.genericDependentMethodCreator,
    genfns = {
      getCandidates: genericDependentMethodCreator('getCandidates', 2),
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
      mkfiltonname = 'makeFilterOn'+rwccodename,
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
      if (!lib.isFunction(this[mkfiltonname])) {
        errstring = this.constructor.name+' does not have the method '+mkfiltonname+'(askerfilter, askerprofile) implemented';
        console.error(errstring);
        return q.reject('METHOD_NOT_IMPLEMENTED', errstring);
      }
      try {
        return this[fetchprofonname](username).then(
          this[mkfiltonname].bind(this, filter)
        ).then(
          filt => {
            return this[rlygetcndtsonname](username, filt);
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

  return RWCHotelServiceMixin;
}
module.exports = createServiceMixin;

