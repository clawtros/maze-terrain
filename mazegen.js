var resolution = 20;
var walldirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
var wallwidth = 1;

function as_path(maze, start, goal) {
    var closed = [];
    var open = [start];
    var came_from = {};
    var f_score = [];
    var g_score = [];
    var cf2 = []

    for (var x in maze.cells) {
        cf2[x] = [];
        f_score[x] = [];
        g_score[x] = [];
        for (var y in maze[x]) {
            cf2[x][y] = false;
            f_score[x][y] = 10;
            g_score[x][y] = 10;
        }
    }

    g_score[start.x][start.y] = 0;
    f_score[start.x][start.y] = 0;

    var get_lowest = function() {
        var lowest = false;
        var retval;
        for (var i in open) {
            if (!lowest || f_score[open[i].x][open[i].y] < lowest) {
                lowest = f_score[open[i].x][open[i].y];
                retval = open[i];
            }
        }
        return retval;
    }
    var dso = function(n) {
        return n / (n!=0?n:1) * (n<0?-1:1);
    }

    var dist_between = function(a, b) {
//        var dx = a.x - b.x;
//        var dy = a.y - b.y;
        var result = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        return result;
    }

    var heuristic_cost_estimate = function(a, b) {
        return 0;//b.walls.map(function(i) { return i ? 10 : 0 }).reduce(function(a,b) { return a+b});
    }

    var reconstruct_path = function(node) {
        var c = node;
        var p = [];
        while (c) {
            p.push(c);
            //c.color = "#cc7";
            //c.draw();
            c = cf2[c.x][c.y];
        }
        //console.log(p);
        return p;
    }


    var shade_distance = function(arr) {
        //console.log(arr);
        var colarr = [];
        var maxlen = 0;
        for (var a in arr) {
            var c = arr[a];
            var p = reconstruct_path(c);
            if (p.length > maxlen) {
                maxlen = p.length;
            }
            colarr.push({ 'cell': c, 'pathlen':p.length });
        }
        if (maxlen > 0) {
            for (var i in colarr) {
                var it = colarr[i];
                var x = 40+Math.floor((it.pathlen / maxlen) * 180);
                
                it.cell.color = "rgb("+Math.floor(x*0.2)+","+Math.floor(x*0.9)+","+Math.floor(x*0.4)+")";
                it.cell.draw();
            }
        }
        return colarr;
    }


    while (open.length > 0) {

        var current = get_lowest();
        closed.push(current);
        open.splice(open.indexOf(current), 1);
        //current.color = "#f77";//"rgb("+col+", "+col+", "+col+")";
        //current.draw();
        var neighbors = maze.getNeighbors(current, true, true);
        //console.log(current, neighbors);
        for (var nidx in neighbors) {

            var n = neighbors[nidx];
            if (closed.indexOf(n) > -1) {
                continue;
            }
            
            tentative_g_score = g_score[current.x][current.y] + dist_between(current, n);
            
            if (open.indexOf(n) == -1 || tentative_g_score <= g_score[n]) {
                
                cf2[n.x][n.y] = current;
                g_score[n.x][n.y] = tentative_g_score;
                f_score[n.x][n.y] = g_score[n.x][n.y] + heuristic_cost_estimate(n, goal);

                if (open.indexOf(n) == -1) {
                    open.push(n);
                }
            }
        }

        if (current == goal) {            
            return [reconstruct_path(current), shade_distance(closed)];
            //return "YAY";
        }
    }

    return [];
    
    
}

function Cell(x,y, ctx) {
    this.visited = false;
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.drawnOn = false;
    //top, right, down, left
    this.color = false;
    this.walls = [true, true, true, true];

    this.draw = function() {
        var pos = {x:this.x * resolution, y:this.y * resolution};
        ctx.fillStyle = "#000";
        ctx.fillRect(pos.x, pos.y, resolution, resolution);

        ctx.fillStyle = this.visited ? "#44c" : "#f00";
        if (this.color) {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(pos.x + wallwidth, pos.y + wallwidth, resolution - wallwidth, resolution - wallwidth);

        for (var wall in this.walls) {

            if (this.walls[wall]) {
                ctx.fillStyle = "#000";
                continue;
            } else {
                var c = (wall*40)+50;
                ctx.fillStyle = "rgb(0,"+c+","+c+")";
                ctx.fillStyle = "#44c";
                if (this.color) {
                    ctx.fillStyle = this.color;
                }
                
            }
            var wd = walldirs[wall];

            if (wall == 0) {
                ctx.fillRect(pos.x + wallwidth, 
                             pos.y,
                             resolution - wallwidth,
                             wallwidth);
            }

            if (wall == 3) {
                ctx.fillRect(pos.x + resolution - wallwidth,
                             pos.y + wallwidth, 
                             wallwidth, 
                             resolution - wallwidth);
            }

            if (wall == 2) {
                ctx.fillRect(pos.x+wallwidth, 
                             pos.y+resolution - wallwidth,
                             resolution - wallwidth,
                             wallwidth);
            }

            if (wall == 1) {
                ctx.fillRect(pos.x, 
                             pos.y + wallwidth,
                             wallwidth,
                             resolution - wallwidth);                   
            }
            
        }
    }
}

function clamp(val, min, max) {
    return Math.min(Math.max(min, val), max);
}

function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function Maze(xsize, ysize, ctx) {
    this.cells = [];
    this.xsize = xsize; 
    this.ysize = ysize;

    var self = this;
    
    for (var i = 0; i < ysize; i++) {
        var row = [];
        for (var j = 0; j < xsize; j++) {
            row.push(new Cell(i, j, ctx));
        }
        this.cells.push(row);
    }

    this.getNeighbors = function(cell, visited, walled) {
        var result = [];
        for (var wd in walldirs) {
            var w = walldirs[wd];
            var append = false;
            try {
                var c = this.cells[w[0] + cell.x][w[1] + cell.y];
                if (c) {
                    if (c.visited == visited) {
                        append = true;
                    }
                    
                    if (walled) {
                        if (!c.walls[parseInt(wd)]) {
                            append = true;
                        } else {
                            append = false;
                        }
                    }
                }
                if (append) result.push(c);
            } catch (err) {
            }
        }
        return result;
    }
    this.numvisited = 0;

    this.getWallByDelta = function(dx, dy) {
        var result = -1;
        for (var w = 0; w < walldirs.length; w++) {
            if (dx == walldirs[w][0] && dy == walldirs[w][1]) {
                return w;
            }
        }
    }
    
    this.breakWall = function(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dir = this.getWallByDelta(dx, dy);
        if (dir > -1) {
            a.walls[dir] = false;
            b.walls[(dir + 2) % 4] = false;
        } else {
            console.log([a.x, a.y], [b.x, b.y], dx, dy);
        }
        a.draw();
        b.draw();
    }

    this.current_cell = choice(choice(this.cells));
    this.backtrack = [];
    this.dfs = function() {
        while (self.current_cell) {
        var n = self.getNeighbors(this.current_cell, false);
        if (n.length == 0) {
            
            var things = self.backtrack.filter(function(r) {return !r.visited});
            self.current_cell = choice(things);
            n = self.getNeighbors(this.current_cell, false);
            var r = self.getNeighbors(this.current_cell, true);
            if (r.length > 0) {
                this.breakWall(choice(r), self.current_cell);
            }
        }
        var c = choice(n);
        if (self.current_cell) {
            self.current_cell.visited = true;
            if (c) {
                this.breakWall(this.current_cell, c);
                c.visited = true;
                self.current_cell = c;
            }
            for (var i = 0; i < n.length; i++) {
                self.backtrack.push(n[i]);
            }
            
            //        self.draw();

            //setTimeout(function() { self.dfs() }, 1);
            //self.dfs();
        } //else {
            }
            //self.clearblock(10,10, 10, 10);
            self.draw();
            //console.log(as_path(this, this.cells[0][0], this.cells[this.cells.length-1][this.cells.length-1]));
        //}

    }
    this.clearblock = function(x1,y1,w,h) {
        for (var i = x1; i < x1+w; i++) {
            for (var j = y1; j < y1+h; j ++) {
                this.cells[i][j].walls = [false, false, false, false];
            }
        }
    }
    this.draw = function() {
        ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);

        for (var i = 0; i < xsize; i++) {
            for (var j = 0; j < ysize; j++) {
                this.cells[j][i].draw();
            }
        }
    }
    self.draw();
    this.clear = function() {
        ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);

        for (var i = 0; i < xsize; i++) {
            for (var j = 0; j < ysize; j++) {
                this.cells[j][i].color = undefined;
                this.cells[j][i].draw();
            }
        }
    }

};

function dfsMaze(ctx) {
    var m = new Maze(ctx.canvas.width / resolution, ctx.canvas.height / resolution, ctx);
    m.dfs();
    return m;
}

function initMaze(canvas) {
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    return dfsMaze(ctx);
}
