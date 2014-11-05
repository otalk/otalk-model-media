window.VideoView = require('otalk-media-stream-view');
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
