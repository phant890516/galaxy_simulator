import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Galaxy
 */
const defaults = {
    count: 49200,
    size: 0.018,
    radius: 2,
    branches: 6,
    spin: -3.277,
    randomness: 0.492,
    randomnessPower: 2.772,
    insideColor: '#5c64cc',
    outsideColor: '#ae4bd2',
    galaxyRotationSpeed: 0.05,
    cameraAutoRotate: false,
    cameraRotateSpeed: 0.5
}

const presets = {
    'デフォルト': { ...defaults },
    'クラシック・スパイラル': {
        count: 100000, size: 0.01, radius: 5, branches: 3, spin: 1,
        randomness: 0.2, randomnessPower: 3,
        insideColor: '#ff6030', outsideColor: '#1b3984'
    },
    '密集コア': {
        count: 80000, size: 0.012, radius: 3, branches: 8, spin: -1.5,
        randomness: 0.15, randomnessPower: 4,
        insideColor: '#ffe4a1', outsideColor: '#4b1248'
    },
    '広がる腕': {
        count: 60000, size: 0.025, radius: 8, branches: 2, spin: 0.5,
        randomness: 0.8, randomnessPower: 2,
        insideColor: '#5c64cc', outsideColor: '#ae4bd2'
    }
}

const parameters = { ...defaults, preset: 'デフォルト' }

let geometry = null
let material = null
let points = null

const generateGalaxy = () =>
{
    // Destroy old one
    if(points !== null){
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }
    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++){
        const i3 = i*3

        //Position
        const radius = Math.random()*parameters.radius
        const spinAngle = radius * parameters.spin
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random()<0.5?1:-1)*parameters.randomness*radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random()<0.5?1:-1)*parameters.randomness*radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random()<0.5?1:-1)*parameters.randomness*radius

        positions[i3+0] = Math.cos(branchAngle + spinAngle) * radius + randomX
        positions[i3+1] = randomY
        positions[i3+2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

        //Color
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius/parameters.radius)

        colors[i3+0]=mixedColor.r
        colors[i3+1]=mixedColor.g
        colors[i3+2]=mixedColor.b
    }

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions,3)
    )
    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors,3)
    )
    /**
     * Material
     */
    material = new THREE.PointsMaterial({
        size:parameters.size,
        sizeAttenuation:true,
        depthWrite:false,
        blending:THREE.AdditiveBlending,
        vertexColors:true
    })

    /**
     * Points
     */
    points = new THREE.Points(geometry,material)
    scene.add(points)
}

generateGalaxy()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 3
camera.position.y = 3
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.autoRotate = parameters.cameraAutoRotate
controls.autoRotateSpeed = parameters.cameraRotateSpeed

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Debug GUI
 */
const gui = new GUI({ title: '銀河設定' })

const shapeFolder = gui.addFolder('銀河の形状')
const randomFolder = gui.addFolder('ランダム性')
const colorFolder = gui.addFolder('カラー')
const animationFolder = gui.addFolder('アニメーション・カメラ')

const shapeControllers = [
    shapeFolder.add(parameters, 'count').min(100).max(200000).step(100).name('パーティクル数').onFinishChange(generateGalaxy),
    shapeFolder.add(parameters, 'size').min(0.001).max(0.1).step(0.001).name('パーティクルサイズ').onFinishChange(generateGalaxy),
    shapeFolder.add(parameters, 'radius').min(0.01).max(20).step(0.01).name('銀河の半径').onFinishChange(generateGalaxy),
    shapeFolder.add(parameters, 'branches').min(2).max(20).step(1).name('腕の数').onFinishChange(generateGalaxy),
    shapeFolder.add(parameters, 'spin').min(-5).max(5).step(0.001).name('渦の強さ').onFinishChange(generateGalaxy)
]

const randomControllers = [
    randomFolder.add(parameters, 'randomness').min(0).max(2).step(0.001).name('散らばり具合').onFinishChange(generateGalaxy),
    randomFolder.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).name('集中度').onFinishChange(generateGalaxy)
]

const colorControllers = [
    colorFolder.addColor(parameters, 'insideColor').name('中心の色').onFinishChange(generateGalaxy),
    colorFolder.addColor(parameters, 'outsideColor').name('外側の色').onFinishChange(generateGalaxy)
]

const animationControllers = [
    animationFolder.add(parameters, 'galaxyRotationSpeed').min(0).max(1).step(0.01).name('銀河の自転速度'),
    animationFolder.add(parameters, 'cameraAutoRotate').name('カメラ自動回転').onChange((value) =>
    {
        controls.autoRotate = value
    }),
    animationFolder.add(parameters, 'cameraRotateSpeed').min(0.1).max(5).step(0.1).name('カメラ回転速度').onChange((value) =>
    {
        controls.autoRotateSpeed = value
    })
]

const allControllers = [
    ...shapeControllers,
    ...randomControllers,
    ...colorControllers,
    ...animationControllers
]

const refreshControllers = () =>
{
    allControllers.forEach((controller) => controller.updateDisplay())
}

// Preset selector
gui.add(parameters, 'preset', Object.keys(presets)).name('プリセット').onChange((presetName) =>
{
    Object.assign(parameters, presets[presetName])
    refreshControllers()
    controls.autoRotate = parameters.cameraAutoRotate
    controls.autoRotateSpeed = parameters.cameraRotateSpeed
    generateGalaxy()
})

// Action buttons
const actions = {
    regenerate: () => generateGalaxy(),
    reset: () =>
    {
        Object.assign(parameters, defaults)
        parameters.preset = 'デフォルト'
        refreshControllers()
        controls.autoRotate = parameters.cameraAutoRotate
        controls.autoRotateSpeed = parameters.cameraRotateSpeed
        generateGalaxy()
    }
}

gui.add(actions, 'regenerate').name('🔄 再生成')
gui.add(actions, 'reset').name('↺ デフォルトに戻す')

shapeFolder.open()
colorFolder.open()
randomFolder.close()
animationFolder.close()

// Mobile toggle for the GUI panel
const guiToggle = document.querySelector('.gui-toggle')
guiToggle.addEventListener('click', () =>
{
    gui.domElement.classList.toggle('gui-hidden')
})
gui.domElement.classList.add('gui-hidden')

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Rotate the galaxy
    if(points)
    {
        points.rotation.y = elapsedTime * parameters.galaxyRotationSpeed
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
