
import * as THREE from "three";
import * as tsl from "three/tsl";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LineSegments2 } from 'three/addons/lines/webgpu/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
document.addEventListener('DOMContentLoaded', () => {

    // Плавная прокрутка к якорям
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80, // Отступ от хедера
                    behavior: 'smooth'
                });
            }
        });
    });

    // Модальное окно бронирования (заглушка)
    const bookBtn = document.getElementById('bookBtn');
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal__content">
            <h3>Форма бронирования</h3>
            <p>Функционал бронирования подключается через CRM-систему или Telegram Bot API.</p>
            <button id="closeModal" class="button button--primary">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'none';

    bookBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.id === 'closeModal') {
            modal.style.display = 'none';
        }
    });

});
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Таймер обратного отсчета для турниров ---
    const countDownDate = new Date("Oct 1, 2026 00:00:00").getTime();
    
    const x = setInterval(function() {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = String(days).padStart(2, '0');
        document.getElementById("hours").innerText = String(hours).padStart(2, '0');
        document.getElementById("minutes").innerText = String(minutes).padStart(2, '0');
        document.getElementById("seconds").innerText = String(seconds).padStart(2, '0');

        if (distance < 0) {
            clearInterval(x);
            document.getElementById("countdownTimer").innerHTML = "ТУРНИР ИДЕТ ПРЯМО СЕЙЧАС!";
        }
    }, 1000);

    // --- 2. Логика бронирования (модалки и карта) ---
    const modal = document.getElementById("bookingModal");
    const selectedPCSpan = document.getElementById("selectedPC");
    let selectedPCId = null;

    // Клики по свободным местам на карте
    document.querySelectorAll('.pc-slot.free').forEach(slot => {
        slot.addEventListener('click', function() {
            selectedPCId = this.dataset.id;
            selectedPCSpan.innerText = selectedPCId;
            modal.style.display = "flex";
        });
    });

    // Закрытие модалки
    document.querySelector(".close-modal").onclick = function() {
        modal.style.display = "none";
    };
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // Подтверждение брони (заглушка)
    document.querySelector('.confirm-book').addEventListener('click', () => {
        alert(`Станция ${selectedPCId} успешно забронирована! Проверьте детали в приложении.`);
        modal.style.display = "none";
        // Здесь должен быть вызов API для записи в базу данных
    });

    // --- 3. Глобальные кнопки ---
    const bookBtn = document.getElementById('bookBtn');
    bookBtn.addEventListener('click', () => {
        // Прокрутка к секции бронирования при нажатии главной кнопки
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    });

});


console.clear();

THREE.Node.captureStackTrace = true;

class FatLines extends LineSegments2{
  constructor(){
    
    let g = new LineSegmentsGeometry();
    let size = {x: 15, y: 15};
    let segs = {x: 100, y: 150};
    const instStart = [];
    const instEnd = [];
    let amount = 0;
    for(let i = 0; i <= segs.y; i++){
      let y = ((i / segs.y) - 0.5) * size.y;
      for(let j = 0; j < segs.x; j++){
        let x1 = (((j + 0) / segs.x) - 0.5) * size.x;
        let x2 = (((j + 1) / segs.x) - 0.5) * size.x;
        
        if(Math.hypot(x1, y) < size.x * 0.5 && Math.hypot(x2, y) < size.x * 0.5){

          instStart.push(x1, 0, -y);
          instEnd.push(x2, 0, -y);
          
          amount += 1;
        }
      }
    };
    //const amount = (segs.y + 1) * segs.x;
    g.instanceCount = amount;
    
    const instStartData = new Float32Array(instStart);
    const instEndData = new Float32Array(instEnd);
    
    console.log(tsl.instancedArray(instStartData, "vec3"));
    
    const attributeStart = new THREE.StorageInstancedBufferAttribute(instStartData, 3);
    const storageStart = tsl.storage(attributeStart, 'vec3', amount).setPBO(true);
    g.setAttribute("instanceStart", attributeStart);
    
    const attributeEnd = new THREE.StorageInstancedBufferAttribute(instEndData, 3);
    const storageEnd = tsl.storage(attributeEnd, 'vec3', amount).setPBO(true);
    g.setAttribute("instanceEnd", attributeEnd);
    
    const instanceStartInit = tsl.instancedArray( instStartData.slice(), 'vec3' );
    const instanceEndInit = tsl.instancedArray( instEndData.slice(), 'vec3' );
    
    const density = 0.125;
    const t = tsl.time.mul(0.25).toVar();
    const amplitude = 4;
    const noiseF = tsl.Fn(([p]) => {
      return tsl.mx_noise_float( tsl.vec3( p.xz.mul( density ), t ) ).mul(amplitude);
    })
        
    const computeF = tsl.Fn(() => {
      //console.log("start")
      
      const posStart = instanceStartInit.element( tsl.instanceIndex ).toVar();
      const posEnd = instanceEndInit.element( tsl.instanceIndex ).toVar();
      
      //console.log("noise");
      const nStart = noiseF(posStart).toVar();
      const nEnd = noiseF(posEnd).toVar();
      
      //console.log("result")
      posStart.y.addAssign(nStart);
      posEnd.y.addAssign(nEnd);
      
      //console.log("write result")
      storageStart.element( tsl.instanceIndex ).assign(posStart);
      storageEnd.element( tsl.instanceIndex ).assign(posEnd);
      
    })();
    const computeNode = tsl.compute(computeF, amount).setName("compute waves");
    
    let m = new THREE.Line2NodeMaterial({
      lineColorNode: tsl.color("aquamarine"),
      linewidth: 0.075,
      worldUnits: true,
      alphaToCoverage: true,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    super(g, m);
    
    // points
    const pointsAmount = 25000;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const rRatio = (size.x * 0.5) / Math.sqrt(pointsAmount);
    const gPoints = tsl.instancedArray(
      new Float32Array(
        Array.from({length: pointsAmount}, (_, idx) => {
          const a = goldenAngle * idx;
          const r = Math.sqrt(idx);
          const v = new THREE.Vector3(
            Math.cos(a) * r,
            0,
            Math.sin(a) * r
          ).multiplyScalar(rRatio);
          return [...v];
        }).flat()
      ),
      "vec3"
    ); // gPoints
    const gPhases = tsl.instancedArray(
      new Float32Array(
        Array.from({length: pointsAmount}, () => {return Math.random()})
      ),
      "float"
    ); // gPhases
    
    const maxShift = 2;
    const maxSpeed = 0.25;
    const computeNodePoints = tsl.Fn(() => {
      
      const phase = gPhases.element(tsl.instanceIndex);
      const point = gPoints.element(tsl.instanceIndex);
      
      const currPhase = phase.toVar();
      const dt = tsl.deltaTime.mul(maxSpeed).toVar();
      currPhase.addAssign(dt);
      
      const currPoint = point.toVar();
      
      const noiseVal = noiseF(currPoint).toVar();
      
      tsl.If(currPhase.greaterThan(1.), () => {
        currPhase.assign(tsl.fract(currPhase));
        currPoint.y.assign(noiseVal.add(currPhase.mul(maxShift)));
      });
      
      phase.assign(currPhase);
      
      currPoint.y.addAssign(dt.mul(maxShift));
      currPoint.y.assign(tsl.max(currPoint.y, noiseVal));
      point.assign(currPoint);
      
    })().compute(pointsAmount).setName("compute points");
    computeNodePoints.onInit(tsl.Fn(() => {
      const pos = gPoints.element(tsl.instanceIndex).toVar();
      const phase = gPhases.element(tsl.instanceIndex).toVar();
      pos.y.assign(noiseF.add(phase.mul(maxShift)));
      gPoints.element(tsl.instanceIndex).assign(pos);
    }));
    
    const mPoints = new THREE.PointsNodeMaterial({
      positionNode: gPoints.element(tsl.instanceIndex),
      sizeNode: tsl.Fn(() => {
        
        const phase = gPhases.element(tsl.instanceIndex);
        const phaseVal = phase.toVar();
        const phaseF = tsl.smoothstep(0, 0.1, phaseVal).sub(tsl.smoothstep(0.5, 1, phaseVal));
        
        return phaseF.mul(0.15);
      })(),
      colorNode: tsl.color("aquamarine"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacityNode: tsl.Fn(() => {
        const uv = tsl.uv().sub(0.5);
        const dist = tsl.length(uv);
        const f = tsl.smoothstep(0, 0.5, dist).oneMinus().toVar();
        
        const phase = gPhases.element(tsl.instanceIndex);
        const phaseVal = phase.toVar();
        const phaseF = tsl.smoothstep(0, 0.1, phaseVal).sub(tsl.smoothstep(0.9, 1, phaseVal));
        
        f.mulAssign(phaseF);
        
        return f;
      })()
    });
    
    const points = new THREE.Sprite(mPoints);
    points.count = pointsAmount;
    
    this.add(points);
    
    this.update = (renderer) => {
      renderer.compute(computeNode);
      renderer.compute(computeNodePoints);
    }
  }
  
}


let scene = new THREE.Scene();
scene.backgroundNode = tsl.Fn(() => {
  const d = tsl.screenUV.sub(0.5).length().toVar();
  const f = tsl.smoothstep(0, 0.75, d);
  const c = tsl.mix(tsl.color(0, 1, 0.75).mul(0.1), tsl.color(0, 0, 0), f);
  return c;
})();
let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(1, 0.25, 1).setLength(10);
let renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

await renderer.init();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
})

let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

let light = new THREE.DirectionalLight(0xffffff, Math.PI);
scene.add(light, new THREE.AmbientLight(0xffffff, Math.PI * 0.5));

let fl = new FatLines();
scene.add(fl);

let clock = new THREE.Timer();
clock.connect(document);
let t = 0;

renderer.setAnimationLoop(() => {
  clock.update();
  let dt = clock.getDelta();
  t += dt;
  controls.update();
  
  fl.update(renderer);
  
  renderer.render(scene, camera);
});

