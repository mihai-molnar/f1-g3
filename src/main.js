import '../style.css'
import { Game } from './Game.js'

document.querySelector('#app').innerHTML = `
  <canvas id="gameCanvas"></canvas>
`

const canvas = document.querySelector('#gameCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new Game(canvas);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  game.width = canvas.width;
  game.height = canvas.height;
});
