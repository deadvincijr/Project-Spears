const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const targetDir = 'C:\\Users\\deank\\.gemini\\antigravity-ide\\brain\\4a758f6f-1e12-401a-87dd-6897b523424c';
const localScreensDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(localScreensDir)) {
  fs.mkdirSync(localScreensDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const captures = [
  {
    name: 'radar_overview.png',
    url: 'http://localhost:8085/?clean=true',
    delay: 2000
  },
  {
    name: 'destination_pin_view.png',
    url: 'http://localhost:8085/?target=true',
    delay: 2500
  },
  {
    name: 'joystick_heading_view.png',
    url: 'http://localhost:8085/?report=true',
    delay: 2500
  },
  {
    name: 'smooth_rotation_view.png',
    url: 'http://localhost:8085/?rotate=45',
    delay: 2500
  },
  {
    name: 'car_directional_rod_preview.png',
    url: 'http://localhost:8085/?preview=true',
    delay: 2500
  },
  {
    name: 'admin_only_remove_pin_view.png',
    url: 'http://localhost:8085/?inspect=true',
    delay: 2500
  },
  {
    name: 'right_click_orientation_drag.png',
    url: 'http://localhost:8085/?rightdrag=true',
    delay: 2500
  },
  {
    name: 'reorient_to_north.png',
    url: 'http://localhost:8085/?reorient=true',
    delay: 700
  },
  {
    name: 'human_seeker_in_list.png',
    url: 'http://localhost:8085/?report=human',
    delay: 2500
  },
  {
    name: 'human_seeker_pin_preview.png',
    url: 'http://localhost:8085/?preview=human',
    delay: 2500
  },
  {
    name: 'report_modal_scrolled_down.png',
    url: 'http://localhost:8085/?report=scrolled',
    delay: 2500
  },
  {
    name: 'three_foot_seekers_selection.png',
    url: 'http://localhost:8085/?report=human',
    delay: 2500
  },
  {
    name: 'foot_seekers_map_no_lines_pulsing.png',
    url: 'http://localhost:8085/?demo=foot',
    delay: 3000
  },
  {
    name: 'fugitive_chat_modal_view.png',
    url: 'http://localhost:8085/?chat=demo',
    delay: 2500
  },
  {
    name: 'fugitive_chat_bottom_bar.png',
    url: 'http://localhost:8085/?clean=true',
    delay: 2000
  },
  {
    name: 'fugitive_chat_unread_badge.png',
    url: 'http://localhost:8085/?chat=unread',
    delay: 2000
  }
];

for (const c of captures) {
  if (process.argv[2] && c.name !== process.argv[2]) continue;
  const brainPath = path.join(targetDir, c.name);
  const localPath = path.join(localScreensDir, c.name);
  const budget = c.delay || 4000;
  const cmd = `"${chromePath}" --headless --screenshot="${brainPath}" --window-size=1280,800 --run-all-compositor-stages-before-draw --virtual-time-budget=${budget} "${c.url}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    fs.copyFileSync(brainPath, localPath);
    console.log('Successfully captured and mirrored: ' + c.name);
  } catch (e) {
    console.error('Failed to capture ' + c.name, e.message);
  }
}
