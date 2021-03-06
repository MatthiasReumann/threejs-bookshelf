import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
/*import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import {RectAreaLightUniformsLib} from 'https://unpkg.com/three@0.126.1/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {RectAreaLightHelper} from 'https://unpkg.com/three@0.126.1/examples/jsm/helpers/RectAreaLightHelper.js';*/

let renderer, scene, camera;
let books = [], lights = [];

const data = getBooks().books;

const bookOffset = 10; //distance between two books
const bookHeight = 10;
const bookWidth = 6.5;
const bookDepth = 1;

let bookIndex = 0;

function updateInfo(){
    const title = document.querySelector('#info h1');
    const author = document.querySelector('#info p');
    const description = document.querySelector('#info text');
    const isbn = document.querySelector('#info span');

    const book = data[bookIndex];
    title.textContent = book.title;
    author.textContent = book.author;
    description.textContent = book.description;
    isbn.textContent = book.isbn;
}

//resize drawingbuffer size (canvas internal resolution)
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function loadDesc(isbn, callback){
    const base_url = "https://openlibrary.org/";

    const isbn_url = `${base_url}/isbn/${isbn}.json`;
    $.get(isbn_url, (isbn_res)=>{
        const work_path = isbn_res.works[0].key;
        if(work_path){
            const work_url = `${base_url}/${work_path}.json`;
            $.get(work_url, (work_res)=>{
                if(work_res.description){
                    if(typeof work_res.description === 'object'){
                        callback(work_res.description.value);
                    }else{
                        callback(work_res.description);
                    }
                }else{
                    callback("No description found");
                }
            })
        }
    });
}

function addBooks(scene, textureLoader){
    let x = 0;
    data.forEach((book)=> {
        const geometry = new THREE.BoxGeometry(bookWidth,bookHeight,bookDepth);
        const cover_url = getCoverURL(book.isbn);

        loadDesc(book.isbn, (desc) => {
            book.description = desc;
            updateInfo();
        });
        
        const materials = [
            new THREE.MeshStandardMaterial({color: 0xFFFFFF}),
            new THREE.MeshStandardMaterial({color: 0xFFFFFF}),
            new THREE.MeshStandardMaterial({color: 0xFFFFFF}),
            new THREE.MeshStandardMaterial({color: 0xFFFFFF}), //bottom/top?
            new THREE.MeshStandardMaterial({map: textureLoader.load(cover_url)}),
            new THREE.MeshStandardMaterial({color: 0xFFFFFF}), //back
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.x = x;
        mesh.position.y = 6;
        mesh.position.z = 0;

        books.push(mesh);

        scene.add(mesh);

        x += bookOffset;
    });   
}

function moveLights(offset){
    lights.forEach((light)=>{
        light.position.x += offset;
    })
}

function addLights(scene){
    const color = 0xFFFFFF;
    const intensity = 4;
    const width = 100;
    const height = 40;

    const light_left = new THREE.RectAreaLight(color, intensity, width, height);
    light_left.position.set(0, 10, 75);
    light_left.rotation.x = Math.PI * -.25; //45 degrees

    const light_right = new THREE.RectAreaLight(color, intensity, width, height);
    light_right.position.set(width + 10, 10, 75);
    light_right.rotation.x = Math.PI * -.25; //45 degrees
    const light_top_left = new THREE.RectAreaLight(color, intensity, width, height);
    light_top_left.position.set(0, 70, 25);
    light_top_left.rotation.x = Math.PI * -.5; //90 degrees

    const light_top_right = new THREE.RectAreaLight(color, intensity, width, height);
    light_top_right.position.set(width + 10, 70, 25);
    light_top_right.rotation.x = Math.PI * -.5; //90 degrees

    scene.add(light_left);
    scene.add(light_right);
    scene.add(light_top_left);
    scene.add(light_top_right);

    lights.push(light_right);
    lights.push(light_left);
    lights.push(light_top_left);
    lights.push(light_top_right);

    /*const helper = new RectAreaLightHelper(light);
    light.add(helper);

    const helper_right = new RectAreaLightHelper(light_right);
    light_right.add(helper_right);

    const helper_top_left = new RectAreaLightHelper(light_top_left);
    light_top_left.add(helper_top_left);


    const helper_top_right = new RectAreaLightHelper(light_top_right);
    light_top_right.add(helper_top_right);*/
}

function addWalls(scene){
    {
        const geo = new THREE.PlaneGeometry(10000,100);

        const mat = new THREE.MeshStandardMaterial({color: 0xFFFFFF});

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = -5;

        scene.add(mesh);
    }

    {
        const geo = new THREE.PlaneGeometry(10000,1000);

        const mat = new THREE.MeshStandardMaterial({color: 0xFFFFFF});

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.x = 0;
        mesh.position.y = -50;
        mesh.position.z = 0;

        mesh.rotation.x = Math.PI * -0.5;

        scene.add(mesh);
    }
}

function addShelf(scene, num_of_books){
    const depth = 5;
    const height = 2;
    const padding = 10;
    const width = (bookWidth * num_of_books) + (bookOffset-bookWidth) * (num_of_books-1) + padding;


    const geometry = new THREE.BoxGeometry(width,height,depth);
    const materials = new THREE.MeshStandardMaterial({color: 0xFFFFFF});
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.x = width/2 - bookWidth/2 - padding/2;
    mesh.position.y = 0;
    mesh.position.z = 0;

    scene.add(mesh);
}

function animate(time) {
        time *= 0.001;  // convert time to seconds

        if(resizeRendererToDisplaySize(renderer)){
            console.log("update drawingbuffer size");
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        
        renderer.render(scene, camera);
        
        requestAnimationFrame(animate);
}

function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color('grey');

    camera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);

    camera.position.set(0, 10, 30);
    
    const canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({canvas});
    renderer.physicallyCorrectLights = true;

    window.addEventListener("keydown", function(){
        var keyCode = event.keyCode;
        switch (keyCode) {
            case KEYS.LEFT:{
                if(camera.position.x > 0){
                    camera.position.x -= bookOffset;
                    moveLights(-bookOffset);
                    bookIndex -= 1;
                    updateInfo();
                }
                break;
            }
            case KEYS.RIGHT:{
                if(camera.position.x < (books.length-1) * bookOffset){
                    camera.position.x += bookOffset;
                    moveLights(bookOffset);
                    bookIndex += 1;
                    updateInfo();
                }
                break;
            }
        }
    }, false);

    addBooks(scene, new THREE.TextureLoader());
    addLights(scene);
    addWalls(scene);
    addShelf(scene, data.length);

    updateInfo();

    requestAnimationFrame(animate);
}

init();