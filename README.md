# otalk-model-media

An Ampersand state model representing a video or audio stream.

## Installing

```sh
$ npm install otalk-model-media
```

## Properties

- `id` - `{String}`
- `stream` - `{Object}`
- `session` - `{Any}`
- `peer` - `{State}`
- `claimed` - `{Boolean}`
- `alterates` - `{Array}`
- `focused` - `{Boolean}`
- `ended` - `{Boolean}`
- `audioPaused` - `{Boolean}`
- `videoPaused` - `{Boolean}`
- `volume` - `{Number}`
- `speaking` - `{Boolean}`
- `activeSpeaker` - `{Boolean}`
- `origin` - `{String}`
- `type` - `{String}`
- `cameraName` - `{String}`
- `micName` - `{String}`
- `thumbnail` - `{String}`
- `videoURL` - `{String}`
- `audioURL` - `{String}`
- `height` - `{Number}`
- `width` - `{Number}`
- `isLocal` - `{Boolean}`
- `isRemote` - `{Boolean}`
- `isAudio` - `{Boolean}`
- `isVideo` - `{Boolean}`
- `isScreen` - `{Boolean}`
- `hasAudio` - `{Boolean}`
- `hasVideo` - `{Boolean}`
- `audioMonitoring` - `{Object}`

### Audio Monitoring Options

- `detectSpeaking` - `{Boolean}`
- `adjustMic` - `{Boolean}`
- `threshold` - `{Number}`
- `interval` - `{Number}`

## Methods

- `fit(width)`
- `pauseAudio()`
- `playAudio()`
- `pauseVideo()`
- `playVideo()`
- `stop()`
- `calculateAlternates()`

## License

MIT
