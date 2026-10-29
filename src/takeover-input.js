export class TakeoverInput{
  constructor(){this.keys=new Set();this.state={steer:0,throttle:0,brake:0};this.bind();}
  bind(){
    const down=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);};
    const up=e=>this.keys.delete(e.code);window.addEventListener('keydown',down,{passive:false});window.addEventListener('keyup',up);window.addEventListener('blur',()=>this.keys.clear());
  }
  read(){const left=this.keys.has('ArrowLeft')||this.keys.has('KeyA'),right=this.keys.has('ArrowRight')||this.keys.has('KeyD'),throttle=this.keys.has('ArrowUp')||this.keys.has('KeyW'),brake=this.keys.has('ArrowDown')||this.keys.has('KeyS')||this.keys.has('Space');this.state={steer:(right?1:0)-(left?1:0),throttle:throttle?1:0,brake:brake?1:0};return this.state;}
  active(){const s=this.read();return Math.abs(s.steer)+s.throttle+s.brake>0;}
}
