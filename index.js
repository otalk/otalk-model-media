var State = require('ampersand-state');
var WebRTC = require('webrtcsupport');
var createHarker = require('hark');


module.exports = State.extend({
    generateId: function (attrs) {
        return attrs.stream.id;
    },

    props: {
        stream: 'object',
        origin: {
            type: 'string',
            default: 'local',
            values: [ 'local', 'remote' ]
        },

        volume: {
            type: 'number',
            required: true,
            default: -1000
        },

        selectedVideoTrackId: 'string',

        isFocused: 'boolean',
        isScreen: 'boolean',
        isEnded: 'boolean',
        isSpeaking: 'boolean',
        isActiveSpeaker: 'boolean',

        // Allow for easy integration with various
        // context managers:
        peer: 'state',
        session: 'state'
    },

    session: {
        _audioMute: 'boolean',
        _videoMute: 'boolean',
        _hardAudioMute: 'boolean',
        _hardVideoMute: 'boolean',
        _remoteAudioMute: 'boolean',
        _remoteVideoMute: 'boolean'
    },

    derived: {
        isLocal: {
            deps: [ 'origin' ],
            fn: function () {
                return this.origin === 'local';
            }
        },
        isRemote: {
            deps: [ 'origin' ],
            fn: function () {
                return this.origin === 'remote';
            }
        },
        isClaimed: {
            deps: [ 'peer' ],
            fn: function () {
                return !!this.peer;
            }
        },
        audioMuted: {
            deps: [ '_audioMute', '_remoteAudioMute', '_hardAudioMute' ],
            fn: function () {
                return this._hardAudioMute || this._remoteAudioMute || this._audioMute;
            }
        },
        videoMuted: {
            deps: [ '_videoMute', '_remoteVideoMute', '_hardVideoMute' ],
            fn: function () {
                return this._hardVideoMute || this._remoteVideoMute || this._videoMute;
            }
        },
        remoteAudioMuted: {
            deps: [ '_remoteAudioMute' ],
            fn: function () {
                return this._remoteAudioMute;
            }
        },
        remoteVideoMuted: {
            deps: [ '_remoteVideoMute' ],
            fn: function () {
                return this._remoteVideoMute;
            }
        },
        hasAudio: {
            cache: false,
            deps: [ 'stream', 'synth-recheck-tracks' ],
            fn: function () {
                var audioTracks = this.stream.getAudioTracks().filter(function (track) {
                    if (track.readyState) {
                        return track.readyState === 'live';
                    } else {
                        return true;
                    }
                });

                return !!audioTracks.length;
            }
        },
        hasVideo: {
            cache: false,
            deps: [ 'stream', 'synth-recheck-tracks' ],
            fn: function () {
                var videoTracks = this.stream.getVideoTracks().filter(function (track) {
                    if (track.readyState) {
                        return track.readyState === 'live';
                    } else {
                        return true;
                    }
                });

                return !!videoTracks.length;
            }
        },
        isAudioOnly: {
            deps: [ 'hasAudio', 'hasVideo' ],
            fn: function () {
                return this.hasAudio && !this.hasVideo;
            }
        },
        isVideo: {
            deps: [ 'hasVideo' ],
            fn: function () {
                return this.hasVideo;
            }
        },
        cameraName: {
            cache: false,
            deps: [ 'stream', 'hasVideo', 'synth-recheck-tracks' ],
            fn: function () {
                if (!this.hasVideo || !this.isLocal) {
                    return '';
                }

                var videoTrack = this.stream.getVideoTracks()[0];
                return videoTrack.label;
            }
        },
        microphoneName: {
            cache: false,
            deps: [ 'stream', 'hasAudio', 'synth-recheck-tracks' ],
            fn: function () {
                if (!this.hasAudio || !this.isLocal) {
                    return '';
                }

                var audioTrack = this.stream.getAudioTracks()[0];
                return audioTrack.label;
            }
        }
    },

    startVolumeMonitor: function (config) {
        var self = this;

        if (!WebRTC.supportWebAudio) {
            return;
        }

        var monitor = this._harker = createHarker(this.stream, config);

        monitor.on('speaking', function () {
            self.isSpeakng = true;
        });

        monitor.on('stopped_speaking', function () {
            self.isSpeaking = false;
        });

        monitor.on('volume_change', function (volume) {
            self.volume = volume;
        });
    },

    stopVolumeMonitor: function () {
        if (this._harker) {
            this._harker.stop();
            this._harker.releaseGroup('monitor');
            delete this._harker;
        }

        this.isSpeaking = false;
        this.unset('volume');
    },

    playAudio: function (remote) {
        if (remote && this.isRemote) {
            this._remoteAudioMute = false;
            return;
        }

        if (this.isLocal) {
            var tracks = this.stream.getAudioTracks();
            tracks.forEach(function (track) {
                track.enabled = true;
            });
        }

        this._audioMute = false;
    },

    muteAudio: function (remote) {
        if (remote && this.isRemote) {
            this._remoteAudioMute = true;
            return;
        }

        this._audioMute = true;

        if (this.isLocal) {
            var tracks = this.stream.getAudioTracks();
            tracks.forEach(function (track) {
                track.enabled = false;
            });
        }
    },

    playVideo: function (remote) {
        if (remote && this.isRemote) {
            this._remoteVideoMute = false;
            return;
        }

        if (this.isLocal) {
            var tracks = this.stream.getVideoTracks();
            tracks.forEach(function (track) {
                track.enabled = true;
            });
        }

        this._videoMute = false;
    },

    muteVideo: function (remote) {
        if (remote && this.isRemote) {
            this._remoteVideoMute = true;
            return;
        }

        this._videoMute = true;

        if (this.isLocal) {
            var tracks = this.stream.getVideoTracks();
            tracks.forEach(function (track) {
                track.enabled = false;
            });
        }
    },

    toggleAudio: function () {
        if (this._audioMute) {
            this.playAudio();
        } else {
            this.muteAudio();
        }
    },

    toggleVideo: function () {
        if (this._videoMute) {
            this.playVideo();
        } else {
            this.muteVideo();
        }
    },

    getTrack: function (trackId) {
        if (this.stream.getTrackById) {
            return this.stream.getTrackById(trackId);
        }

        var foundTrack = null;
        this.stream.getTracks().forEach(function (track) {
            if (track.id === trackId) {
                foundTrack = track;
            }
        });

        return foundTrack;
    },

    createStreamForSelectedVideoTrack: function () {
        if (WebRTC.prefix !== 'webkit' || !this.selectedVideoTrackId) {
            return this.stream;
        }

        var track = this.getTrack(this.selectedVideoTrackId);
        if (!track) {
            return this.stream;
        }

        var newStream = new WebRTC.MediaStream();

        newStream.addTrack(track);

        this.stream.getAudioTracks().forEach(function (audioTrack) {
            newStream.addTrack(audioTrack);
        });

        return newStream;
    },

    stop: function () {
        this.stopVolumeMonitor();

        this.stream.getTracks().forEach(function (track) {
            if (track.readyState !== 'ended') {
                track.stop();
            }
        });

        this.isEnded = true;
    },

    initialize: function () {
        var self = this;

        this.id = this.generateId(this);

        this.stream.addEventListener('ended', function () {
            self.isEnded = true;
        });

        this.stream.addEventListener('inactive', function () {
            self.isEnded = true;
        });

        this.stream.getTracks().forEach(function (track) {
            self._registerTrackEvents(track);
        });

        this.stream.addEventListener('addtrack', function (e) {
            self._registerTrackEvents(e.track);
        });

        this.stream.addEventListener('removetrack', function () {
            self.trigger('change:synth-recheck-tracks');
        });

        self.trigger('change:synth-recheck-tracks');
    },

    _registerTrackEvents: function (track) {
        var self = this;

        track.onended = function () {
            self.trigger('change:synth-recheck-tracks');
        };

        track.onmute = function () {
            self._handleTrackMuteChange(track);
        };

        track.onunmute = function () {
            self._handleTrackMuteChange(track);
        };
    },

    _handleTrackMuteChange: function (track) {
        if (track.kind === 'audio') {
            this._hardAudioMute = track.muted;
            return;
        }

        var videoTracks = this.stream.getVideoTracks();
        var allMuted = true;
        videoTracks.forEach(function (videoTrack) {
            if (!videoTrack.muted) {
                allMuted = false;
            }
        });

        this._hardVideoMute = allMuted;
    }
});
