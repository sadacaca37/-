import * as THREE from "three";

export class DayNightCycle {
  public scene: THREE.Scene;
  public cycleDuration: number = 240; // 240 seconds per full Minecraft day/night cycle
  public time: number = 60; // Start at morning/day (time in seconds)

  // Celestial objects
  public sunGroup: THREE.Group;
  public sunMesh: THREE.Mesh;
  public sunLight: THREE.DirectionalLight;

  public moonGroup: THREE.Group;
  public moonMesh: THREE.Mesh;
  public moonLight: THREE.DirectionalLight;

  public stars: THREE.Points;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;

  // Sky colors
  private daySky = new THREE.Color(0x78a7ff);
  private sunsetSky = new THREE.Color(0xd97736);
  private nightSky = new THREE.Color(0x0a0e1c);
  private currentSkyColor = new THREE.Color();

  constructor(
    scene: THREE.Scene,
    ambientLight: THREE.AmbientLight,
    hemiLight: THREE.HemisphereLight,
    existingSunLight?: THREE.DirectionalLight
  ) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.hemiLight = hemiLight;

    // 1. Sun Setup
    this.sunGroup = new THREE.Group();
    this.scene.add(this.sunGroup);

    // Authentic square pixel Sun
    const sunGeo = new THREE.PlaneGeometry(16, 16);
    const sunCanvas = document.createElement("canvas");
    sunCanvas.width = 16;
    sunCanvas.height = 16;
    const sctx = sunCanvas.getContext("2d")!;
    sctx.fillStyle = "#fffbeb";
    sctx.fillRect(0, 0, 16, 16);
    sctx.fillStyle = "#fef08a";
    sctx.fillRect(2, 2, 12, 12);
    sctx.fillStyle = "#ffffff";
    sctx.fillRect(4, 4, 8, 8);

    const sunTex = new THREE.CanvasTexture(sunCanvas);
    sunTex.magFilter = THREE.NearestFilter;
    sunTex.minFilter = THREE.NearestFilter;

    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(0, 0, -120);
    this.sunMesh.lookAt(0, 0, 0);
    this.sunGroup.add(this.sunMesh);

    if (existingSunLight) {
      this.sunLight = existingSunLight;
    } else {
      this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
      this.scene.add(this.sunLight);
    }

    // 2. Moon Setup
    this.moonGroup = new THREE.Group();
    this.scene.add(this.moonGroup);

    // Authentic square pixel Moon with craters
    const moonGeo = new THREE.PlaneGeometry(14, 14);
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = 16;
    moonCanvas.height = 16;
    const mctx = moonCanvas.getContext("2d")!;
    mctx.fillStyle = "#e2e8f0";
    mctx.fillRect(0, 0, 16, 16);
    mctx.fillStyle = "#cbd5e1";
    mctx.fillRect(2, 2, 4, 4);
    mctx.fillRect(8, 7, 5, 5);
    mctx.fillRect(3, 10, 4, 3);
    mctx.fillStyle = "#ffffff";
    mctx.fillRect(5, 3, 2, 2);

    const moonTex = new THREE.CanvasTexture(moonCanvas);
    moonTex.magFilter = THREE.NearestFilter;
    moonTex.minFilter = THREE.NearestFilter;

    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonMesh.position.set(0, 0, 120);
    this.moonMesh.lookAt(0, 0, 0);
    this.moonGroup.add(this.moonMesh);

    this.moonLight = new THREE.DirectionalLight(0x738bd6, 0.25);
    this.scene.add(this.moonLight);

    // 3. Stars field (600 sharp pixel stars)
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 140;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10; // keep above horizon
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0.0,
      sizeAttenuation: false,
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);
  }

  public update(deltaTime: number, playerPos: THREE.Vector3) {
    this.time = (this.time + deltaTime) % this.cycleDuration;
    const progress = this.time / this.cycleDuration; // 0.0 to 1.0

    // Celestial angle (0 to 2*PI)
    const angle = progress * Math.PI * 2;

    // Follow player position so celestial bodies don't drift away
    this.sunGroup.position.copy(playerPos);
    this.moonGroup.position.copy(playerPos);
    this.stars.position.copy(playerPos);

    // Rotate Sun & Moon around X axis
    this.sunGroup.rotation.x = angle;
    this.moonGroup.rotation.x = angle;
    this.stars.rotation.x = angle * 0.1;

    // Calculate height of sun above horizon (-1 to +1)
    const sunElevation = Math.sin(angle);
    const isDay = sunElevation > -0.15;
    const isSunset = Math.abs(sunElevation) < 0.25;

    // Sky & Fog color transitions
    if (sunElevation > 0.2) {
      // Full daylight
      this.currentSkyColor.copy(this.daySky);
      (this.stars.material as THREE.PointsMaterial).opacity = 0.0;
    } else if (sunElevation > -0.2) {
      // Twilight / Sunset / Sunrise
      const t = (sunElevation + 0.2) / 0.4;
      if (sunElevation > 0) {
        this.currentSkyColor.lerpColors(this.sunsetSky, this.daySky, t);
      } else {
        this.currentSkyColor.lerpColors(this.nightSky, this.sunsetSky, t);
      }
      (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - t);
    } else {
      // Midnight / Full Night
      this.currentSkyColor.copy(this.nightSky);
      (this.stars.material as THREE.PointsMaterial).opacity = 0.9;
    }

    this.scene.background = this.currentSkyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(this.currentSkyColor);
    }

    // Light adjustments
    if (isDay) {
      const intensity = Math.max(0.2, Math.min(1.2, sunElevation * 1.5));
      this.sunLight.intensity = intensity;
      this.sunLight.color.setHex(isSunset ? 0xfda4af : 0xfffaed);
      this.moonLight.intensity = 0.05;

      this.ambientLight.intensity = 0.25 + intensity * 0.45;
      this.hemiLight.intensity = 0.15 + intensity * 0.25;
    } else {
      // Night time
      this.sunLight.intensity = 0.0;
      this.moonLight.intensity = 0.28;
      this.ambientLight.intensity = 0.18; // Soft moonlight ambient
      this.hemiLight.intensity = 0.12;
    }

    // Position directional lights
    const sunWorldPos = new THREE.Vector3();
    this.sunMesh.getWorldPosition(sunWorldPos);
    this.sunLight.position.copy(sunWorldPos);
    this.sunLight.target.position.copy(playerPos);

    const moonWorldPos = new THREE.Vector3();
    this.moonMesh.getWorldPosition(moonWorldPos);
    this.moonLight.position.copy(moonWorldPos);
    this.moonLight.target.position.copy(playerPos);
  }

  public get isNight(): boolean {
    const progress = this.time / this.cycleDuration;
    const sunElevation = Math.sin(progress * Math.PI * 2);
    return sunElevation < -0.1;
  }

  public get lightLevel(): number {
    const progress = this.time / this.cycleDuration;
    const sunElevation = Math.sin(progress * Math.PI * 2);
    if (sunElevation > 0.2) return 15;
    if (sunElevation < -0.2) return 4;
    return Math.floor(4 + ((sunElevation + 0.2) / 0.4) * 11);
  }
}
