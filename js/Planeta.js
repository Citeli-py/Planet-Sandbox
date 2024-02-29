// Obtém o elemento canvas
const canvas = document.getElementById('planetCanvas');
canvas.width = window.innerWidth-300;
canvas.height = window.innerHeight-20;

// Obtém o contexto de desenho 2D
const ctx = canvas.getContext('2d');

const width = canvas.width;
const height = canvas.height;

var deltaTime = 0.01;

function drawCircle(pos, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI); 
    ctx.fill();
}

function fillBackground(){
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,width,height);
}

function distance2(pos1, pos2){
    res = [pos2[0]-pos1[0], pos2[1]-pos1[1]]
    return res[0]**2 + res[1]**2
}

class Planeta{
    constructor(pos, vel, massa){
        this.pos = pos;
        this.vel = vel;
        this.massa = massa;
        this.aceleracao = [0, 0];
        
        this.densidade = 700; 
        this.raio = (massa/this.densidade)**(1/3);
        if (this.raio < 2)
            this.raio = 2;

        this.tam_traco = 50;
        this.fila_traco = [];
    }

    gravity(planet){
        var G = 1, M = planet.massa;
        let r2 = distance2(this.pos, planet.pos);
        let a = -G*M/r2;

        let r = r2**0.5
        this.aceleracao[0] -= a*(planet.pos[0] - this.pos[0])/r; // a*cos(theta)
        this.aceleracao[1] += a*(+planet.pos[1] - this.pos[1])/r; // a*sen(theta)
    }

    colision(planet) {
        let d = distance2(planet.pos, this.pos);
        if (d <= (planet.raio + this.raio)**2)
            return true;

        return false;
    }

    inScreen(){
        if(this.pos[0] > width || this.pos[0] < 0)
            return false

        if(this.pos[1] > height || this.pos[1] < 0)
            return false

        return true

    }

    async move() {
        // Velocidade instatanea
        this.vel[0] += this.aceleracao[0]*deltaTime;
        this.vel[1] += this.aceleracao[1]*deltaTime;

        this.pos[0] += this.vel[0]*deltaTime;
        this.pos[1] -= this.vel[1]*deltaTime;

        this.aceleracao = [0,0];
    }

    async drawTraco(){
        if(this.fila_traco.length>0){
            let pos_ant = this.fila_traco[this.fila_traco.length-1];
            let d = distance2(this.pos, pos_ant);
            if(d > 20) 
                this.fila_traco.push([this.pos[0], this.pos[1]]);
        }
        else
            this.fila_traco.push([this.pos[0], this.pos[1]]);


        if(this.tam_traco < this.fila_traco.length)
            this.fila_traco.shift();

        for(let i=0; i< this.fila_traco.length; i++)
            drawCircle(this.fila_traco[i], 1, `rgba(255,255,255, ${((i+1)/this.fila_traco.length)})`)
    }

    async draw(){
        drawCircle(this.pos, this.raio, "#FFFFFF");
        this.drawTraco();
    }

    setVel(vel){
        this.vel = vel;
    }
};

class PlanetController{
    constructor(){
        this.planet_list = [];
    }

    createPlanet(pos, vel, massa){
        this.planet_list.push(new Planeta(pos, vel, massa));
    }

    destroyPlanet(planet){
        this.planet_list = this.planet_list.filter(function(p){return p !== planet;})
    }

    planetColision(p1, p2){
        
        let new_mass = p1.massa + p2.massa;
        let new_pos = [ (p1.pos[0]*p1.massa + p2.pos[0]*p2.massa)/new_mass, 
                        (p1.pos[1]*p1.massa + p2.pos[1]*p2.massa)/new_mass];

        let new_vel = [ (p1.massa*p1.vel[0]+p2.massa*p2.vel[0])/new_mass,
                        (p1.massa*p1.vel[1]+p2.massa*p2.vel[1])/new_mass];

        this.destroyPlanet(p1);
        this.destroyPlanet(p2);
        this.createPlanet(new_pos, new_vel, new_mass);
    }

    reset(){
        this.planet_list= [];
    }

    async renderDraw(){
        for(let i=0; i<this.planet_list.length; i++)
            if(this.planet_list[i].inScreen())
                this.planet_list[i].draw();
    }

    async calcGravity(){ // tentar juntar funções 
        for(let i=0; i<this.planet_list.length; i++)
            for(let j=0; j< this.planet_list.length; j++)
                if(i != j)
                    this.planet_list[i].gravity(this.planet_list[j]);
    }

    async calcColision(){
        for(let i=0; i<this.planet_list.length; i++)
            for(let j=0; j< this.planet_list.length; j++)       
                if(i != j && this.planet_list[i].colision(this.planet_list[j]))
                    this.planetColision(this.planet_list[i], this.planet_list[j]);
    }

    render(){
        fillBackground();
        this.renderDraw();
        if(!PAUSE){
            this.calcGravity();
            this.calcColision();
                    
            for(let i=0; i<this.planet_list.length; i++)
                this.planet_list[i].move();
        }
    }
};

document.addEventListener('click', function(event) {
    // Obter posição do mouse
    var rect = canvas.getBoundingClientRect();
    var mouseX = event.clientX - rect.left;
    var mouseY = event.clientY - rect.top;
    
    if((mouseX >= 0 && mouseX <= width) && (mouseY>=0 && mouseY<= height)){
        var vx = parseFloat(document.getElementById('vx').value);
        var vy = parseFloat(document.getElementById('vy').value);
        var massa = parseFloat(document.getElementById('massa').value);
        
        if(!isNaN(massa) && !isNaN(vx) && !isNaN(vy))
            controller.createPlanet([mouseX, mouseY], [vx, vy], massa);
    }
});

var MOUSE_POS = [0,0];
document.addEventListener('mousemove', function(event) {
    var rect = canvas.getBoundingClientRect();
    var mouseX = event.clientX - rect.left;
    var mouseY = event.clientY - rect.top;

    MOUSE_POS = [mouseX, mouseY];
});

function drawCursor(){
    var densidade = 700;
    var massa = parseFloat(document.getElementById('massa').value);

    if((MOUSE_POS[0] >= 0 && MOUSE_POS[0] <= width) && (MOUSE_POS[1]>=0 && MOUSE_POS[1]<= height) && !isNaN(massa)){
        let raio = (massa/densidade)**(1/3);
        if (raio < 2)
            raio = 2;

        drawCircle([MOUSE_POS[0], MOUSE_POS[1]], raio, "#FFFFFF")
    }
}

var PAUSE = false;
function pausar(){
    PAUSE = !PAUSE;

    var botaoPause = document.getElementById('botao-pause');
    if(PAUSE)
        botaoPause.style.backgroundColor = 'red';
    else
        botaoPause.style.backgroundColor = 'greenyellow';
}

controller = new PlanetController();

function main(){
    controller.render();
    drawCursor();
}



setInterval(main, deltaTime);