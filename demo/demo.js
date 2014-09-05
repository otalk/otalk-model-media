var View = require('ampersand-view');

window.VideoView = View.extend({
    template: '<div><p data-hook="volume"></p><p data-hook="speaking"></p><audio autoplay data-hook="audio"></audio><video autoplay muted data-hook="video"></video></div>',
    bindings: {
        'model.audioURL': {
            type: 'attribute',
            name: 'src',
            hook: 'audio'
        },
        'model.videoURL': {
            type: 'attribute',
            name: 'src',
            hook: 'video'
        },
        'model.volume': {
            type: 'text',
            hook: 'volume'
        },
        'model.speaking': {
            type: 'text',
            hook: 'speaking'
        },
        'model.audioPaused': {
            type: 'booleanAttribute',
            name: 'paused',
            hook: 'audio'
        },
        'model.videoPaused': {
            type: 'booleanAttribute',
            name: 'paused',
            hook: 'video'
        }
    },

    autoRender: true,

    render: function () {
        this.renderWithTemplate();

        this.listenTo(this.model, 'change:audioPaused', function () {
            if (this.model.audioPaused) {
                this.query('audio').pause();
            } else {
                this.query('audio').play();
            }
        });

        this.listenTo(this.model, 'change:videoPaused', function () {
            if (this.model.videoPaused) {
                this.query('video').pause();
            } else {
                this.query('video').play();
            }
        });

        this.cacheElements({
            audio: 'audio',
            video: 'video'
        });

        this.video.oncontextmenu = function (e) {
            e.preventDefault();
        };

        this.audio.oncontextmenu = function (e) {
            e.preventDefault();
        };
    }
});

window.Stream = require('../index');
window.localMedia = new (require('localmedia'))();

window.localMedia.start({audio: true, video: {mandatory: {maxWidth: 400}}}, function (err, stream) {
    window.localMedia.start({audio: false, video: true}, function (err, stream2) {
        stream.addTrack(stream2.getVideoTracks()[0]);

        window.stream = new window.Stream({
            id: stream.id,
            stream: stream,
            origin: 'local',
            audioMonitoring: {
                detectSpeaking: true,
                adjustMic: true
            }
        });


        window.view = new window.VideoView({model: window.stream, el: document.querySelector('[data-hook~=streambox]')});
    });
});
