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
- `selectedVideoTrackId` - `{String}`
- `isFocused` - `{Boolean}`
- `isEnded` - `{Boolean}`
- `audioMuted` - `{Boolean}`
- `videoMuted` - `{Boolean}`
- `volume` - `{Number}`
- `isSpeaking` - `{Boolean}`
- `isActiveSpeaker` - `{Boolean}`
- `origin` - `{String}`
- `isLocal` - `{Boolean}`
- `isRemote` - `{Boolean}`
- `isAudioOnly` - `{Boolean}`
- `isVideo` - `{Boolean}`
- `isScreen` - `{Boolean}`
- `hasAudio` - `{Boolean}`
- `hasVideo` - `{Boolean}`

## Methods

- `muteAudio([remoteSignaled])`
- `playAudio([remoteSignaled])`
- `muteVideo([remoteSignaled])`
- `playVideo([remoteSignaled)`
- `startAudioMonitor()`
- `stopAudioMonitor()`
- `stop()`

## License

MIT
