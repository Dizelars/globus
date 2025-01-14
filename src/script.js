import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import earthVertexShader from './shaders/earth/vertex.glsl'
import earthFragmentShader from './shaders/earth/fragment.glsl'
import atmosphereVertexShader from './shaders/atmosphere/vertex.glsl'
import atmosphereFragmentShader from './shaders/atmosphere/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()
textureLoader.setCrossOrigin("anonymous");

/**
 * Earth
 */
const earthParameters = {}
earthParameters.atmosphereDayColor = '#00aaff'
earthParameters.atmosphereTwilightColor = '#ff6600'

gui
    .addColor(earthParameters, 'atmosphereDayColor')
    .onChange(() =>
    {
        earthMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
        atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(earthParameters.atmosphereDayColor)
    })

gui
    .addColor(earthParameters, 'atmosphereTwilightColor')
    .onChange(() =>
    {
        earthMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
        atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(earthParameters.atmosphereTwilightColor)
    })

// Textures
const earthDayTexture = textureLoader.load('./earth/day.jpg')
earthDayTexture.colorSpace = THREE.SRGBColorSpace
earthDayTexture.anisotropy = 8

const earthNightTexture = textureLoader.load('./earth/night.jpg')
earthNightTexture.colorSpace = THREE.SRGBColorSpace
earthNightTexture.anisotropy = 8

const earthSpecularCloudsTexture = textureLoader.load('./earth/specularClouds.jpg')
earthSpecularCloudsTexture.anisotropy = 8

// Mesh
let radius = 2;
const earthGeometry = new THREE.SphereGeometry(radius, 64, 64)
const earthMaterial = new THREE.ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms:
    {
        uDayTexture: new THREE.Uniform(earthDayTexture),
        uNightTexture: new THREE.Uniform(earthNightTexture),
        uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
    }
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
earth.geometry.rotateY(-Math.PI * 0.5);

scene.add(earth)

// Atmosphere
const atmosphereMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms:
    {
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereDayColor)),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color(earthParameters.atmosphereTwilightColor))
    },
})

const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial)
atmosphere.scale.set(1.04, 1.04, 1.04)
scene.add(atmosphere)

// The X axis is red. The Y axis is green. The Z axis is blue.
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

/**
 * Sun
 */
// Coordinates
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5)
const sunDirection = new THREE.Vector3()

// Debug
const debugSun = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 2),
    new THREE.MeshBasicMaterial()
)
// scene.add(debugSun)


/**
 * Add Coordinates
*/

// Массив для хранения лейблов
// const labels = [];

// Глобальная функция для обновления позиции всех лейблов
// const updateLabelPositions = (camera, renderer) => {
//     labels.forEach(({ label, position }) => {
//         const screenPosition = position.clone().project(camera);
//         // const x = (screenPosition.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
//         // const y = (-screenPosition.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

//         const x = (-screenPosition.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
//         const y = (screenPosition.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

//         label.style.left = `${x}px`;
//         label.style.top = `${y}px`;
//     });
// };

// Функция для добавления нового объекта (например, конуса) на сферу
const addLocation = (latitude, longitude, radiusEarth) => {
    let coordSpherical = {
        lat: THREE.MathUtils.degToRad(90 - latitude),
        lon: THREE.MathUtils.degToRad(longitude)
    };
    // console.log(coordSpherical);

    let positionVector = new THREE.Vector3().setFromSphericalCoords(
        radiusEarth,
        coordSpherical.lat,
        coordSpherical.lon
    );

    // check we did it correctly
    // let spherical = new THREE.Spherical().setFromVector3(positionVector);
    // console.log(spherical);

    // let lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), positionVector]);
    // let line = new THREE.Line(
    //     lineGeom,
    //     new THREE.LineBasicMaterial({ color: "yellow" })
    // );
    // earth.add(line);

    // Начальная и конечная точки линии
    const start = new THREE.Vector3(0, 0, 0); // Начало линии
    const end = positionVector.clone();       // Конец линии

    // Вычисляем направление линии
    const direction = end.clone().sub(start).normalize();

    // Увеличиваем длину линии на, например, 10 единиц
    const lengthIncrease = 0.5;
    const newEnd = end.clone().add(direction.multiplyScalar(lengthIncrease));

    // Создаём новую геометрию с удлинённой линией
    let lineGeom = new THREE.BufferGeometry().setFromPoints([start, newEnd]);

    // Создаём линию с материалом
    let line = new THREE.Line(
        lineGeom,
        new THREE.LineBasicMaterial({ color: "yellow" })
    );

    // Добавляем линию к сцене
    earth.add(line);


    // Создаем HTML-элемент для текста
    // const label = document.createElement('div');
    // label.className = 'city-label';
    // label.textContent = cityName;
    // label.style.position = 'absolute';
    // label.style.color = 'white';
    // label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    // label.style.padding = '2px 5px';
    // label.style.borderRadius = '4px';
    // label.style.fontSize = '12px';

    // // Добавляем элемент на страницу
    // document.body.appendChild(label);

    // // Сохраняем лейбл и позицию в массив labels
    // labels.push({ label, position: newEnd });

    // Обновляем позицию элемента сразу после создания
    // updateLabelPositions(camera, renderer);
}


// Объект для хранения добавляемых координат
const locationsData = {
    location1: {
        latitude: 55.755864,
        longitude: 37.617698,
        name: 'Moscow'
    },
    location2: {
        latitude: 25.792235,
        longitude: -80.250852,
        name: 'Miami'
    }
};

// Проверка с использованием оператора `in`
for (const key in locationsData) {
    if (locationsData.hasOwnProperty(key)) {
        const { latitude, longitude, name } = locationsData[key];
        addLocation(latitude, longitude, radius, name);
    }
}

console.log(locationsData);


// Наша форма
const form = document.querySelector('.addLocations form');
if (form) {
    const latitudeInput = form.querySelector('.latitude input');
    const longitudeInput = form.querySelector('.longitude input');
    const nameofTownInput = form.querySelector('.town_name input');
    const addButton = form.querySelector('.addButton');

    addButton.addEventListener('click', (event) => {
        event.preventDefault(); // предотвращаем стандартное поведение кнопки (если это кнопка submit)

        // Проверяем, что все поля формы заполнены
        if (latitudeInput.value !== '' && longitudeInput.value !== '' && nameofTownInput.value !== '') {
            // Создаем новый объект с данными из формы
            const newLocation = {
                latitude: parseFloat(latitudeInput.value),
                longitude: parseFloat(longitudeInput.value),
                name: nameofTownInput.value
            };

            // Добавляем новый объект в locationsData, используя уникальный ключ
            const locationKey = `location${Object.keys(locationsData).length + 1}`;
            locationsData[locationKey] = newLocation;

            // Выводим обновленный объект locationsData в консоль
            console.log(locationsData);

            // Добавляем новую точку на глобус
            addLocation(newLocation.latitude, newLocation.longitude, radius, newLocation.name);

            // Очистить поля формы после добавления
            latitudeInput.value = '';
            longitudeInput.value = '';
            nameofTownInput.value = '';
        } else {
            alert('Пожалуйста, заполните все поля!');
        }
    });
}


// Update
const updateSun = () =>
{
    // Sun direction
    sunDirection.setFromSpherical(sunSpherical)

    // Debug
    debugSun.position
        .copy(sunDirection)
        .multiplyScalar(5)

    // Uniforms
    earthMaterial.uniforms.uSunDirection.value.copy(sunDirection)
    atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection)
}

updateSun()

// Tweaks
gui
    .add(sunSpherical, 'phi')
    .min(0)
    .max(Math.PI)
    .onChange(updateSun)

gui
    .add(sunSpherical, 'theta')
    .min(- Math.PI)
    .max(Math.PI)
    .onChange(updateSun)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 12
camera.position.y = 5
camera.position.z = 4
// camera.position.z = 14
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.setClearColor('#000011')

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Обновляем вращение Земли
    earth.rotation.y = elapsedTime * 0.1

    // Обновляем позиции всех лейблов
    // updateLabelPositions(camera, renderer);

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()