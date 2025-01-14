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

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

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

// Loaders
const textureLoader = new THREE.TextureLoader()
textureLoader.setCrossOrigin("anonymous");

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster()

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
earth.name = 'earth';

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
const labels = [];

// Массив для хранения типонов
const points = [];

let countPoints = 1;
let sceneReady = true;

// Функция для добавления нового объекта (например, конуса) на сферу
const addLocation = (latitude, longitude, radiusEarth, cityName) => {
    // degToRad - Преобразует градусы в радианы.
    // Выражение (90 - latitude) используется для корректировки координаты широты: в географической системе, 0° широты — это экватор, а в сферической системе (используемой в этом коде), полюс находится в направлении оси Y. Таким образом, координата широты lat указывается как угол отклонения от оси Y (полярный угол).
    let coordSpherical = {
        lat: THREE.MathUtils.degToRad(90 - latitude),
        lon: THREE.MathUtils.degToRad(longitude)
    };
    // console.log(coordSpherical);

    // setFromSphericalCoords: Устанавливает этот вектор из сферических координат радиуса, phi и theta.
    // phi - полярный угол в радианах от оси y (вверх). По умолчанию 0. 
    // theta - экваторный угол в радианах вокруг оси y (вверх). По умолчанию 0.
    let positionVector = new THREE.Vector3().setFromSphericalCoords(
        radiusEarth,        // радиус сферы (например, радиус Земли)
        coordSpherical.lat, // полярный угол (широта в радианах)
        coordSpherical.lon  // экваторный угол (долгота в радианах)
    );

    // check we did it correctly
    // let spherical = new THREE.Spherical().setFromVector3(positionVector);
    // console.log(spherical);

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

    
    // Создаем HTML-элемент для точки в координате города
    const label = document.createElement('div');
    label.classList.add('point', `point_${countPoints}`);

    // Передаем координаты точки в дата атрибуты элемента html
    // label.setAttribute("data_coordinate_x", `${positionVector.x}`)
    // label.setAttribute("data_coordinate_y", `${positionVector.y}`)
    // label.setAttribute("data_coordinate_z", `${positionVector.z}`)

    // Создаем элемент круга на координате
    const labelCircle = document.createElement('div');
    labelCircle.classList.add('label');
    label.appendChild(labelCircle);

    // Создаем элемент с анимацией пульсации
    const pulseCircle = document.createElement('div');
    pulseCircle.classList.add('pulseTipon');
    label.appendChild(pulseCircle);

    // Создаем элемент с текстом-описанием точки на координате
    const textInfo = document.createElement('div');
    textInfo.classList.add('text');

    const cityTitle = document.createElement('div');
    cityTitle.classList.add('city_name');
    cityTitle.textContent = cityName;
    textInfo.appendChild(cityTitle);

    const latitudeInfo = document.createElement('div');
    latitudeInfo.classList.add('city_latitude');
    latitudeInfo.textContent = latitude;
    textInfo.appendChild(latitudeInfo);

    const longitudeInfo = document.createElement('div');
    longitudeInfo.classList.add('city_longitude');
    longitudeInfo.textContent = longitude;
    textInfo.appendChild(longitudeInfo);

    label.appendChild(textInfo);

    // Добавляем элемент на страницу
    document.body.appendChild(label);

    // Добавляем новому элементу точки обработчик клика
    label.addEventListener('click', () => {
        label.classList.toggle('show');

        // Берем переданные координаты чтобы подлететь к ним камерой +-
        // let labelXCoordinate = label.getAttribute('data_coordinate_x');
        // let labelYCoordinate = label.getAttribute('data_coordinate_y');
        // let labelZCoordinate = label.getAttribute('data_coordinate_z');
        // console.log(labelXCoordinate, labelYCoordinate, labelZCoordinate);

        // camera.lookAt(labelXCoordinate, labelYCoordinate, labelZCoordinate)

        // Проверка наличия класса 'show' у остальных точек
        labels.forEach((otherLabel) => {
            if (otherLabel.label !== label) {
                otherLabel.label.classList.remove('show');
            }
        });
    });

    // Сохраняем лейбл и позицию в массив labels
    labels.push({ label, position: newEnd });

    // Добавляем уникальные координаты каждой созданной точке в массиве
    points.push({
        position: new THREE.Vector3(positionVector.x, positionVector.y, positionVector.z), 
        element: document.querySelector(`.point_${countPoints}`)
    })

    countPoints++;
    console.log(points);
}


// Добавление точек с анимацией появления линии (пока криво)
// const addLocation = (latitude, longitude, radiusEarth, cityName) => {
//     let coordSpherical = {
//         lat: THREE.MathUtils.degToRad(90 - latitude),
//         lon: THREE.MathUtils.degToRad(longitude)
//     };

//     let positionVector = new THREE.Vector3().setFromSphericalCoords(
//         radiusEarth,
//         coordSpherical.lat,
//         coordSpherical.lon
//     );

//     const start = new THREE.Vector3(0, 0, 0);
//     const end = positionVector.clone();
//     const direction = end.clone().sub(start).normalize();

//     // Создаём линию без удлинения
//     let lineGeom = new THREE.BufferGeometry().setFromPoints([start, start]); // Начало и конец совпадают
//     let line = new THREE.Line(
//         lineGeom,
//         new THREE.LineBasicMaterial({ color: "yellow" })
//     );

//     earth.add(line);

//     const label = document.createElement('div');
//     label.classList.add('point', `point_${countPoints}`);

//     const labelCircle = document.createElement('div');
//     labelCircle.classList.add('label');
//     label.appendChild(labelCircle);

//     const pulseCircle = document.createElement('div');
//     pulseCircle.classList.add('pulseTipon');
//     label.appendChild(pulseCircle);

//     const textInfo = document.createElement('div');
//     textInfo.classList.add('text');

//     const cityTitle = document.createElement('div');
//     cityTitle.classList.add('city_name');
//     cityTitle.textContent = cityName;
//     textInfo.appendChild(cityTitle);

//     const latitudeInfo = document.createElement('div');
//     latitudeInfo.classList.add('city_latitude');
//     latitudeInfo.textContent = latitude;
//     textInfo.appendChild(latitudeInfo);

//     const longitudeInfo = document.createElement('div');
//     longitudeInfo.classList.add('city_longitude');
//     longitudeInfo.textContent = longitude;
//     textInfo.appendChild(longitudeInfo);

//     label.appendChild(textInfo);

//     document.body.appendChild(label);

//     label.addEventListener('click', () => {
//         // Закрыть все остальные линии
//         labels.forEach((otherLabel) => {
//             if (otherLabel.label !== label) {
//                 otherLabel.label.classList.remove('show');
//                 otherLabel.line.geometry.setFromPoints([start, start]); // Возвращаем линию в исходное состояние
//             }
//         });
    
//         // Переключаем текущий лейбл
//         label.classList.toggle('show');
    
//         if (label.classList.contains('show')) {
//             const lengthIncrease = 0.5;
//             const newEnd = end.clone().add(direction.clone().multiplyScalar(lengthIncrease)); // Фиксированное конечное положение
    
//             // Анимация изменения длины линии
//             const animationDuration = 200; // Длительность анимации в мс
//             let startTime = null;
    
//             const animateLine = (timestamp) => {
//                 if (!startTime) startTime = timestamp;
//                 const elapsedTime = timestamp - startTime;
//                 const progress = Math.min(elapsedTime / animationDuration, 1);
    
//                 // Вычисляем промежуточное положение конца линии
//                 const intermediateEnd = start.clone().lerp(newEnd, progress);
    
//                 // Обновляем геометрию линии
//                 lineGeom.setFromPoints([start, intermediateEnd]);
    
//                 if (progress < 1) {
//                     requestAnimationFrame(animateLine);
//                 }
//             };
    
//             // Всегда начинаем с исходного состояния
//             lineGeom.setFromPoints([start, start]);
//             requestAnimationFrame(animateLine);
//         } else {
//             // Скрыть линию (возврат к начальной точке)
//             lineGeom.setFromPoints([start, start]);
//         }
//     });    

//     // Сохраняем информацию о лейбле и линии
//     labels.push({ label, line });
//     points.push({
//         position: positionVector,
//         element: document.querySelector(`.point_${countPoints}`)
//     });

//     countPoints++;
// };


// Объект для хранения добавляемых координат
const locationsData = {
    location1: {
        latitude: 55.755864,
        longitude: 37.617698,
        name: 'Moscow'
    },
    location2: {
        latitude: -37.813747,
        longitude: 144.963033,
        name: 'Melbourne'
    },
    location3: {
        latitude: 39.901850,
        longitude: 116.391441,
        name: 'Beijing'
    }
};

// Проверка с использованием оператора `in`
for (const key in locationsData) {
    if (locationsData.hasOwnProperty(key)) {
        const { latitude, longitude, name } = locationsData[key];
        addLocation(latitude, longitude, radius, name);
    }
}

// console.log(locationsData);


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
 * Points on globus
 */
// Логика типонов
// controls.addEventListener('change', () => {
//     positionTipons();
// });

// controls.addEventListener('end', () => {
//     raycasterTipons();
//     // console.log(renderer.info)
//     // console.log(camera.position);
// });

// function raycasterTipons() {
//     if (sceneReady) {
//         for(const point of points) {
//             const screenPosition = point.position.clone()
//             screenPosition.project(camera)

//             raycaster.setFromCamera(screenPosition, camera)
//             const intersects = raycaster.intersectObjects(scene.children, true)

//             if (intersects.length === 0) {
//                 point.element.classList.add('visible')
//             }
//             else {
//                 const intersectionDistance = intersects[0].distance
//                 const pointDistance = point.position.distanceTo(camera.position)
//                 if (intersectionDistance < pointDistance) {
//                     point.element.classList.remove('visible')
//                 }
//                 else {
//                     point.element.classList.add('visible')
//                 }
//             }
//         }
//     }
// }

function raycasterTipons() {
    if (sceneReady) {
        for (const point of points) {
            const screenPosition = point.position.clone();
            screenPosition.project(camera);

            raycaster.setFromCamera(screenPosition, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length === 0) {
                // Если нет пересечений, сделать элемент видимым
                point.element.classList.add('visible');
            } else {
                // Найти пересечения только с мешем с именем "earth"
                const earthIntersect = intersects.find(intersect => intersect.object.name === 'earth');

                if (!earthIntersect) {
                    // Если нет пересечения с "earth", сделать элемент видимым
                    point.element.classList.add('visible');
                } else {
                    const intersectionDistance = earthIntersect.distance;
                    const pointDistance = point.position.distanceTo(camera.position);

                    if (intersectionDistance < pointDistance) {
                        // Если пересечение ближе, чем точка, скрыть элемент
                        point.element.classList.remove('visible');
                    } else {
                        // Иначе сделать элемент видимым
                        point.element.classList.add('visible');
                    }
                }
            }
        }
    }
}

function positionTipons() {
    if (sceneReady) {
        for(const point of points) {
            const screenPosition = point.position.clone()
            screenPosition.project(camera)

            const translateX = screenPosition.x * sizes.width * 0.5
            const translateY = - screenPosition.y * sizes.height * 0.5
            point.element.style.transform = `translate(${translateX}px, ${translateY}px)`
        }
    }
}


// Попытка сохранить координаты точек при анимации глобуса.
// function raycasterTipons() {
//     if (sceneReady) {
//         for (const point of points) {
//             // Получаем мировую позицию точки
//             const worldPosition = point.position.clone();
            
//             // Применяем вращение Земли (rotation.y) к позиции точки
//             const rotationMatrix = new THREE.Matrix4();
//             rotationMatrix.makeRotationY(earth.rotation.y); // Ротация Земли
//             worldPosition.applyMatrix4(rotationMatrix);

//             // Проецируем точку на экран
//             const screenPosition = worldPosition.clone();
//             screenPosition.project(camera);

//             // Используем raycaster для определения видимости
//             raycaster.setFromCamera(screenPosition, camera);
//             const intersects = raycaster.intersectObjects(scene.children, true);

//             if (intersects.length === 0) {
//                 // Если нет пересечений, точка видима
//                 point.element.classList.add('visible');
//             } else {
//                 // Проверяем пересечение с мешем "earth"
//                 const earthIntersect = intersects.find(intersect => {
//                     // Проверяем, что объект пересечения — это Земля, а не её дочерние элементы
//                     return intersect.object.name === 'earth' && intersect.object === earth;
//                 });

//                 if (earthIntersect) {
//                     // Точка скрыта только если она за Землей в пространстве камеры
//                     const intersectionDistance = earthIntersect.distance;
//                     const pointDistance = point.position.distanceTo(camera.position);

//                     // Если точка находится за Землей в пространстве камеры, скрываем её
//                     if (intersectionDistance < pointDistance) {
//                         point.element.classList.remove('visible');
//                     } else {
//                         point.element.classList.add('visible');
//                     }
//                 } else {
//                     // Если пересечение не с Землей, точка видима
//                     point.element.classList.add('visible');
//                 }
//             }
//         }
//     }
// }

// function positionTipons() {
//     if (sceneReady) {
//         for (const point of points) {
//             // Получаем координаты точки в мировом пространстве
//             const worldPosition = point.position.clone();
            
//             // Применяем вращение Земли (rotation.y) к позиции точки
//             const rotationMatrix = new THREE.Matrix4();
//             rotationMatrix.makeRotationY(earth.rotation.y); // Ротация Земли

//             // Применяем ротацию к мировым координатам
//             worldPosition.applyMatrix4(rotationMatrix);

//             // Проецируем точку на экран
//             const screenPosition = worldPosition.clone();
//             screenPosition.project(camera);

//             // Расчитываем смещения
//             const translateX = screenPosition.x * sizes.width * 0.5;
//             const translateY = -screenPosition.y * sizes.height * 0.5;

//             // Применяем трансформацию
//             point.element.style.transform = `translate(${translateX}px, ${translateY}px)`;
//         }
//     }
// }

// controls.update();



/**
 * Point click
 */
// const pointsOnModel = document.querySelectorAll('.point')

// pointsOnModel.forEach((point) => {
//     point.addEventListener('click', () => {
//         point.classList.toggle('show')

//         // Проверка наличия класса 'show' у остальных точек
//         pointsOnModel.forEach((otherPoint) => {
//             if (otherPoint !== point) {
//                 if (otherPoint.classList.contains('show')) {
//                     otherPoint.classList.remove('show')
//                 }
//             }
//         })
//     })
// })


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'lowp'
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)
renderer.shadowMap.autoUpdate = false;
renderer.setClearColor('#000011')


// console.log(scene.children)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    // Обновляем вращение Земли
    const elapsedTime = clock.getElapsedTime()
    // earth.rotation.y = elapsedTime * 0.1

    // Update controls
    controls.update()

    // Обновляем позицию и видимость типонов
    raycasterTipons();
    positionTipons();

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()