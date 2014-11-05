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
- `videoSubStreams` - `{Array}`
- `activeVideoStream` - `{Int}`
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
- `videoURLs` - `{Array}`
- `lowResVideoURL` - `{String}`
- `highResVideoURL` - `{String}`
- `audioURL` - `{String}`
- `isLocal` - `{Boolean}`
- `isRemote` - `{Boolean}`
- `isAudio` - `{Boolean}`
- `isVideo` - `{Boolean}`
- `isScreen` - `{Boolean}`
- `hasAudio` - `{Boolean}`
- `hasVideo` - `{Boolean}`
- `audioMonitoring` - `{Object}`
- `highResVideoAvailable` - `{Boolean}`
- `highResVideoActive` - `{Boolean}`
- `lowResVideoActive` - `{Boolean}`

### Audio Monitoring Options

- `detectSpeaking` - `{Boolean}`
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
