var webrtc = require('webrtcsupport');
var hark = require('hark');
var GainController = require('mediastream-gain');
var State = require('ampersand-state');


module.exports = State.extend({
    props: {
        id: 'string',
        owner: 'any',
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
        },
        cameraName: 'string',
        micName: 'string',
        audioMonitoring: ['object', true, function () {
            return {
                detectSpeaking: false,
                adjustMic: false,
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
        videoURL: {
            deps: ['isVideo', 'stream', 'simulcast', 'alternates'],
            fn: function () {
                if (this.simulcast !== undefined && this.alternates.length > 1) {
                    if (!!this.alternates[this.simulcast]) {
                        return this.alternates[this.simulcast].url;
                    }
                }

                if (this.isVideo) {
                    return URL.createObjectURL(this.stream);
                }

                return '';
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

        this.calculateAlternates();

        if (this.isLocal && this.hasAudio && this.audioMonitoring.detectSpeaking) {
            var audio = this.harker = hark(this.stream, this.audioMonitoring);
            var gain, timeout;

            if (this.audioMonitoring.adjustMic) {
                gain = this.gainController = new GainController(this.stream);
                gain.setGain(0.5);
            }

            audio.on('speaking', function () {
                self.speaking = true;
                if (!self.audioPaused && self.audioMonitoring.adjustMic) {
                    gain.setGain(1);
                }
            });

            audio.on('stopped_speaking', function () {
                if (timeout) {
                    clearTimeout(timeout);
                }

                timeout = setTimeout(function () {
                    self.speaking = false;
                    if (!self.audioPaused && self.audioMonitoring.adjustMic) {
                        gain.setGain(0.5);
                    }
                });
            });

            audio.on('volume_change', function (volume) {
                self.volume = volume;
            });
        }

        this.stream.onended = function () {
            self.ended = true;
        };
    },

    fit: function (width) {
        var selected;

        // Find the best match for the given size
        for (var i = 0, len = this.alternates.length; i < len; i++) {
            var alt = this.alternates[i];
            if (alt.width < width) {
                selected = i;
                break;
            }
        }
        
        // None of the available videos fit inside the given dimension,
        // so use the smallest one we have.
        if (selected === undefined) {
            selected = this.alternates.length - 1;
        }

        // It could be the case that the given width is *slightly*
        // smaller than one of the alternates, and the next size down
        // is tiny. Here we'll check if the next biggest video from our
        // currently selected one is a closer fit for the desired width.
        // If so, we can downscale that with less distortion than trying
        // to upscale the (potentially tiny) currently selected video.
        //
        // This gives us better video quality, but at the expense of using
        // more bandwidth.
        if (selected > 0) {
            var upscaleAlt = this.alternates[selected];
            var upscale = Math.abs(width - upscaleAlt.width) / upscaleAlt.width;
            console.log('upscale', upscale);

            var downscaleAlt = this.alternates[selected - 1];
            var downscale = Math.abs(width - downscaleAlt.width) / downscaleAlt.width;
            console.log('Downscale', downscale);

            if (downscale < upscale) {
                selected = selected - 1;
            }
        }

        this.simulcast = selected;
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
    },

    calculateAlternates: function () {
        var self = this;

        this.alternates = [];

        // Firefox doesn't support creating new MediaStreams directly,
        // so we can't calculate alternate stream dimensions.
        if (webrtc.prefix !== 'webkit') {
            return;
        }

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
    }
});
