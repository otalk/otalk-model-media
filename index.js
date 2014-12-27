var hark = require('hark');
var webrtc = require('webrtcsupport');
var State = require('ampersand-state');


module.exports = State.extend({
    props: {
        id: 'string',
        session: 'any',
        peer: 'state',
        thumbnail: 'string',
        stream: 'object',
        videoSubStreams: ['array', true],
        activeVideoStream: 'number',
        focused: 'boolean',
        ended: 'boolean',
        audioPaused: 'boolean',
        videoPaused: 'boolean',
        volume: 'number',
        speaking: 'boolean',
        activeSpeaker: 'boolean',
        isScreen: 'boolean',
        origin: {
            type: 'string',
            values: ['local', 'remote']
        },
        cameraName: 'string',
        micName: 'string',
        audioMonitoring: ['object', true, function () {
            return {
                detectSpeaking: false,
                threshold: -50,
                interval: 50,
                smoothing: 0.1
            };
        }]
    },

    derived: {
        type: {
            deps: ['stream'],
            fn: function () {
                var videos = this.stream.getVideoTracks();
                if (videos.length) {
                    return 'video';
                } else {
                    return 'audio';
                }
            }
        },
        claimed: {
            deps: ['peer'],
            fn: function () {
                return !!this.peer;
            }
        },
        videoURLs: {
            deps: ['isVideo', 'stream', 'videoSubStreams'],
            fn: function () {
                var urls = [];

                this.videoSubStreams.forEach(function (substream) {
                    urls.push(substream.url);
                });

                return urls;
            }
        },
        lowResVideoURL: {
            deps: ['videoSubStreams'],
            fn: function () {
                return (this.videoSubStreams[0] || {}).url || '';
            }
        },
        highResVideoURL: {
            deps: ['videoSubStreams', 'lowResVideoURL'],
            fn: function () {
                return (this.videoSubStreams[1] || {}).url || this.lowResVideoURL;
            }
        },
        highResVideoAvailable: {
            deps: ['videoSubStreams'],
            fn: function () {
                return this.videoSubStreams.length > 1;
            }
        },
        lowResVideoActive: {
            deps: ['activeVideoStream'],
            fn: function () {
                return !this.activeVideoStream || this.activeVideoStream === 0;
            }
        },
        highResVideoActive: {
            deps: ['activeVideoStream'],
            fn: function () {
                return this.activeVideoStream > 0;
            }
        },
        audioURL: {
            deps: ['stream', 'hasAudio'],
            fn: function () {
                if (this.hasAudio) {
                    return URL.createObjectURL(this.stream);
                }
                return '';
            }
        },
        isLocal: {
            deps: ['origin'],
            fn: function () {
                return this.origin === 'local';
            }
        },
        isRemote: {
            deps: ['origin'],
            fn: function () {
                return this.origin === 'remote';
            }
        },
        hasAudio: {
            deps: ['stream'],
            fn: function () {
                return !!this.stream.getAudioTracks().length;
            }
        },
        hasVideo: {
            deps: ['stream'],
            fn: function () {
                return !!this.stream.getVideoTracks().length;
            }
        },
        isAudio: {
            deps: ['type'],
            fn: function () {
                return this.type === 'audio';
            }
        },
        isVideo: {
            deps: ['type'],
            fn: function () {
                return this.type === 'video';
            }
        }
    },

    initialize: function () {
        var self = this;

        // Save the camera and mic names before we might add additional
        // filters to them which would affect the device labels.
        if (this.stream.getVideoTracks().length) {
            this.cameraName = this.stream.getVideoTracks()[0].label;
        }

        if (this.stream.getAudioTracks().length) {
            this.micName = this.stream.getAudioTracks()[0].label;
        }

        this._extractVideoTracks();

        if (this.isLocal && this.hasAudio && this.audioMonitoring.detectSpeaking) {
            var audio = this.harker = hark(this.stream, this.audioMonitoring);

            audio.on('speaking', function () {
                self.speaking = true;
            });

            audio.on('stopped_speaking', function () {
                self.speaking = false;
            });

            audio.on('volume_change', function (volume) {
                self.volume = volume;
            });
        }

        this.stream.onended = function () {
            self.stop();
        };
    },

    pauseAudio: function () {
        this.audioPaused = true;
        var tracks = this.stream.getAudioTracks();
        tracks.forEach(function (track) {
            track.enabled = false;
        });
    },

    playAudio: function () {
        this.audioPaused = false;
        var tracks = this.stream.getAudioTracks();
        tracks.forEach(function (track) {
            track.enabled = true;
        });
    },

    pauseVideo: function () {
        this.videoPaused = true;
        var tracks = this.stream.getVideoTracks();
        tracks.forEach(function (track) {
            track.enabled = false;
        });
        this.videoSubStreams.forEach(function (substream) {
            substream.stream.getVideoTracks()[0].enabled = false;
        });
    },

    playVideo: function () {
        this.videoPaused = false;
        var tracks = this.stream.getVideoTracks();
        tracks.forEach(function (track) {
            track.enabled = true;
        });
        this.videoSubStreams.forEach(function (substream) {
            substream.stream.getVideoTracks()[0].enabled = true;
        });
    },

    stop: function () {
        this.ended = true;

        if (this.harker) {
            this.harker.stop();
            this.harker.releaseGroup('monitor');
            delete this.harker;
        }

        this.stream.stop();

        this.videoSubStreams.forEach(function (substream) {
            substream.stream.stop();
            URL.revokeObjectURL(substream.url);
        });

        URL.revokeObjectURL(this.audioURL);
    },

    _extractVideoTracks: function () {
        var substreams = [];

        if (this.stream.addTrack) {
            var tracks = this.stream.getVideoTracks();
            for (var i = 0, len = tracks.length; i < len; i++) {
                var track = tracks[i];
                var substream = new webrtc.MediaStream();
                substream.addTrack(track);
                substreams.push({
                    url: URL.createObjectURL(substream),
                    stream: substream
                });
            }
        } else {
            substreams.push({
                url: URL.createObjectURL(this.stream),
                stream: this.stream
            });
        }

        this.videoSubStreams = substreams;
    }
});
