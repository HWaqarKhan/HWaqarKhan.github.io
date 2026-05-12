import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

class EnergyRibbons {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.15); // Distance fade

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);
        this.time = 0;

        this.init();
        this.createRibbons();
        this.createDust();
        this.setupPostProcessing();
        this.addEventListeners();
        this.animate();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
    }

    createRibbons() {
        const count = 60; // Number of ribbons
        const segments = 100; // Segments per ribbon

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * segments * 3);
        const ribbonIds = new Float32Array(count * segments);
        const segmentIds = new Float32Array(count * segments);

        for (let i = 0; i < count; i++) {
            for (let j = 0; j < segments; j++) {
                const index = (i * segments + j) * 3;

                // Initial positions (will be animated in shader)
                positions[index] = (i / count - 0.5) * 15; // Spread across x
                positions[index + 1] = 0; // y
                positions[index + 2] = (j / segments) * 20 - 10; // Spread across z

                ribbonIds[i * segments + j] = i;
                segmentIds[i * segments + j] = j / segments;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('ribbonId', new THREE.BufferAttribute(ribbonIds, 1));
        geometry.setAttribute('segmentId', new THREE.BufferAttribute(segmentIds, 1));

        // Create line segments (indices)
        const indices = [];
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < segments - 1; j++) {
                indices.push(i * segments + j, i * segments + j + 1);
            }
        }
        geometry.setIndex(indices);

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uColor1: { value: new THREE.Color(0x00f2ff) }, // Neon Blue
                uColor2: { value: new THREE.Color(0x7000ff) }  // Purple
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying float vSegmentId;
                varying float vRibbonId;
                varying float vViewZ;
                attribute float ribbonId;
                attribute float segmentId;

                // Simple noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 = v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute( permute( permute(
                               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                void main() {
                    vSegmentId = segmentId;
                    vRibbonId = ribbonId;
                    
                    vec3 pos = position;
                    
                    // Warp speed movement
                    float speed = 2.0;
                    float zOffset = mod(pos.z + uTime * speed, 20.0) - 10.0;
                    pos.z = zOffset;
                    
                    // Topographic flow / Simplex displacement
                    float noiseFreq = 0.2 + uMouse.x * 0.1;
                    float noiseAmp = 1.5 + uMouse.y * 1.0;
                    
                    float noise = snoise(vec3(pos.x * noiseFreq, pos.z * noiseFreq, uTime * 0.5));
                    pos.y += noise * noiseAmp;
                    
                    // Interaction: tilt based on mouse
                    pos.x += uMouse.x * (pos.z + 10.0) * 0.5;
                    pos.y += uMouse.y * (pos.z + 10.0) * 0.5;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    vViewZ = -mvPosition.z;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                varying float vSegmentId;
                varying float vRibbonId;
                varying float vViewZ;

                void main() {
                    // Gradient based on segment and ribbon ID
                    float mixValue = vSegmentId;
                    vec3 color = mix(uColor1, uColor2, mixValue);
                    
                    // Add some variation per ribbon
                    color += sin(vRibbonId * 0.5) * 0.1;

                    // Fade out at ends of segments
                    float alpha = smoothstep(0.0, 0.2, vSegmentId) * smoothstep(1.0, 0.8, vSegmentId);
                    
                    // DEPTH FADE: Decrease opacity of distant lines
                    float depthFade = smoothstep(20.0, 5.0, vViewZ);
                    alpha *= depthFade;

                    // Boost intensity slightly for focal point
                    vec3 finalColor = color * (0.8 + depthFade * 0.4);

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const lines = new THREE.LineSegments(geometry, this.material);
        this.scene.add(lines);
    }

    createDust() {
        const count = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            sizes[i] = Math.random() * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: 0x00f2ff,
            size: 0.05,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.dust = new THREE.Points(geometry, material);
        this.scene.add(this.dust);
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.3, // Heavily reduced strength
            0.4, // radius
            0.92 // Increased threshold (less bloom)
        );
        this.composer.addPass(bloomPass);
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.01;
        this.material.uniforms.uTime.value = this.time;

        // Smooth mouse movement
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;
        this.material.uniforms.uMouse.value.copy(this.mouse);

        // Camera tilt
        this.camera.rotation.y = -this.mouse.x * 0.1;
        this.camera.rotation.x = this.mouse.y * 0.1;

        // Animate dust
        if (this.dust) {
            this.dust.rotation.y += 0.0005;
            this.dust.position.z = Math.sin(this.time * 0.5) * 0.5;
        }

        this.composer.render();
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnergyRibbons();
});
