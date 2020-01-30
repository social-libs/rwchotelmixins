function createServiceMixin (execlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

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

    klass.prototype[rlygetcndtsonname] = execSuite.dependentServiceMethod([], [rwccodename], reallyGetCandidatesFunc);

    klass.prototype['initiateRelationOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], initiateRelationFunc);

    klass.prototype['blockRelationOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], blockRelationFunc);

    klass.prototype['acceptRelationOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], acceptRelationFunc);

    klass.prototype['getInitiatorsOn'+rwccodename] = execSuite.dependentServiceMethod([], [rwccodename], getInitiatorsFunc);

    klass.prototype[fetchprofonname] = execSuite.dependentServiceMethod([], [rwccodename], fetchProfileFunc);

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


  function reallyGetCandidatesFunc (rwcsink, username, filter, defer) {
    qlib.promise2defer(rwcsink.call('getCandidates', username, filter), defer);
  }

  function initiateRelationFunc (rwcsink, initiatorname, targetname, defer) {
    qlib.promise2defer(rwcsink.call('initiateRelation', initiatorname, targetname), defer);
  }

  function getInitiatorsFunc (rwcsink, username, defer) {
    qlib.promise2defer(rwcsink.call('getInitiators', username), defer);
  }

  function blockRelationFunc (rwcsink, initiatorname, targetname, defer) {
    qlib.promise2defer(rwcsink.call('blockRelation', initiatorname, targetname), defer);
  }

  function acceptRelationFunc (rwcsink, initiatorname, targetname, defer) {
    qlib.promise2defer(rwcsink.call('acceptRelation', initiatorname, targetname), defer);
  }

  function fetchProfileFunc (rwcsink, username, defer) {
    qlib.promise2defer(rwcsink.call('fetchProfile', username), defer);
  }

  return RWCHotelServiceMixin;
}
module.exports = createServiceMixin;

