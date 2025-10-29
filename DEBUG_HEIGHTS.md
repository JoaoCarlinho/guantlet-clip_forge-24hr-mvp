# Debug Heights Script

Please open DevTools Console and run this script to see the height of each container in the hierarchy:

```javascript
// Get all the containers
const playerSection = document.querySelector('.player-section');
const videoPlayerContainer = document.querySelector('.video-player-container');
const videoWrapper = document.querySelector('.video-wrapper');

console.log('=== CONTAINER HEIGHTS ===');

if (playerSection) {
  const ps = window.getComputedStyle(playerSection);
  console.log('\n.player-section:');
  console.log('  height:', ps.height);
  console.log('  offsetHeight:', playerSection.offsetHeight + 'px');
  console.log('  display:', ps.display);
  console.log('  grid-row:', ps.gridRow);
} else {
  console.log('\n.player-section: NOT FOUND');
}

if (videoPlayerContainer) {
  const vpc = window.getComputedStyle(videoPlayerContainer);
  console.log('\n.video-player-container:');
  console.log('  height:', vpc.height);
  console.log('  offsetHeight:', videoPlayerContainer.offsetHeight + 'px');
  console.log('  display:', vpc.display);
  console.log('  flex-direction:', vpc.flexDirection);
} else {
  console.log('\n.video-player-container: NOT FOUND');
}

if (videoWrapper) {
  const vw = window.getComputedStyle(videoWrapper);
  console.log('\n.video-wrapper:');
  console.log('  height:', vw.height);
  console.log('  offsetHeight:', videoWrapper.offsetHeight + 'px');
  console.log('  width:', vw.width);
  console.log('  display:', vw.display);
  console.log('  flex-direction:', vw.flexDirection);
  console.log('  overflow-y:', vw.overflowY);
} else {
  console.log('\n.video-wrapper: NOT FOUND');
}

console.log('\n=== WINDOW ===');
console.log('  innerHeight:', window.innerHeight + 'px');
console.log('  innerWidth:', window.innerWidth + 'px');
```

## What to Look For

After running the script, you should see something like:

```
=== CONTAINER HEIGHTS ===

.player-section:
  height: XXXpx          ← This should be ~66% of window height
  offsetHeight: XXXpx
  ...

.video-player-container:
  height: YYYpx          ← Should match .player-section height
  offsetHeight: YYYpx
  ...

.video-wrapper:
  height: ZZZpx          ← Should match .video-player-container height
  offsetHeight: ZZZpx    ← Currently 298px (WRONG!)
  width: 830px           ← This is correct
  ...

=== WINDOW ===
  innerHeight: WWWpx     ← Your window height
  innerWidth: WWWpx
```

**Expected:**
- `.player-section` height should be ~66% of `innerHeight` (because grid is 2fr/1fr)
- `.video-player-container` should match `.player-section`
- `.video-wrapper` should match `.video-player-container`

**Current Problem:**
- `.video-wrapper` is only 298px

Copy the output and save it to `/Users/joaocarlinho/gauntlet/clip_forge/logs/heights.txt` or paste it here!

 [Log] === CONTAINER HEIGHTS ===
[Log] 
.player-section:
[Log]   height: – "300px"
[Log]   offsetHeight: – "300px"
[Log]   display: – "flex"
[Log]   grid-row: – "1"
[Log] 
.video-player-container:
[Log]   height: – "298px"
[Log]   offsetHeight: – "298px"
[Log]   display: – "flex"
[Log]   flex-direction: – "column"
[Log] 
.video-wrapper:
[Log]   height: – "298px"
[Log]   offsetHeight: – "298px"
[Log]   width: – "830px"
[Log]   display: – "flex"
[Log]   flex-direction: – "column"
[Log]   overflow-y: – "auto"
[Log] 
=== WINDOW ===
[Log]   innerHeight: – "522px"
[Log]   innerWidth: – "1280px"
< undefined
