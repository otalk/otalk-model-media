var webrtc = require('webrtcsupport');
var State = require('ampersand-state');


module.exports = State.extend({
    props: {
        id: 'string',
        session: 'object',
        alternates: 'array',
        simulcast: ['number', true, 0],
        thumbnail: 'string',
        stream: 'object',
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
        }
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
        cameraName: {
            deps: ['type', 'stream'],
            fn: function () {
                if (this.stream.getVideoTracks()) {
                    return this.stream.getVideoTracks()[0].label;
                }
            }
        },
        micName: {
            deps: ['type', 'stream'],
            fn: function () {
                if (this.stream.getAudioTracks()) {
                    return this.stream.getAudioTracks()[0].label;
                }
            }
        },
        videoURL: {
            deps: ['stream', 'simulcast', 'alternates'],
            fn: function () {
                if (this.simulcast !== undefined && this.alternates.length > 1) {
                    if (!!this.alternates[this.simulcast]) {
                        return this.alternates[this.simulcast].url;
                    }
                }

                return URL.createObjectURL(this.stream);
            }
        },
        audioURL: {
            deps: ['stream'],
            fn: function () {
                return URL.createObjectURL(this.stream);
            }
        },
        height: {
            deps: ['type', 'simulcast', 'alternates'],
            fn: function () {
                if (this.type === 'video' && !!this.alternates[this.simulcast]) {
                    return this.alternates[this.simulcast].height;
                }
                return 0;
            }
        },
        width: {
            deps: ['type', 'simulcast', 'alternates'],
            fn: function () {
                if (this.type === 'video' && !!this.alternates[this.simulcast]) {
                    return this.alternates[this.simulcast].width;
                }
                return 0;
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

        this.alternates = [];

        var tracks = this.stream.getVideoTracks();
        tracks.forEach(function (track) {
            var subStream = new webrtc.MediaStream();
            subStream.addTrack(track);

            var subURL = URL.createObjectURL(subStream);

            var video = document.createElement('video');
            video.src = subURL;

            video.onloadedmetadata = function () {
                self.alternates.push({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    url: subURL,
                    stream: subStream
                });
                self.alternates.sort(function (a, b) {
                    return a.width > b.width ? -1
                         : a.width < b.width ? 1
                         : 0;
                });
                self.trigger('change:alternates', self.alternates);
            };
        });
    },

    fit: function (width) {
        for (var i = 0, len = this.alternates.length; i < len; i++) {
            var alt = this.alternates[i];
            if (alt.width < width) {
                this.simulcast = i;
                return;
            }
        }

        // Fallback to the last in the set
        this.simulcast = this.alternates.length - 1;
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
        this.alternates.forEach(function (alternate) {
            alternate.stream.getVideoTracks()[0].enabled = false;
        });
    },

    playVideo: function () {
        this.videoPaused = false;
        var tracks = this.stream.getVideoTracks();
        tracks.forEach(function (track) {
            track.enabled = true;
        });
        this.alternates.forEach(function (alternate) {
            alternate.stream.getVideoTracks()[0].enabled = true;
        });
    },

    stop: function () {
        this.ended = true;
        this.stream.stop();
        this.alternates.forEach(function (alternate) {
            alternate.stream.stop();
        });
    }
});