



import {MinHeap} from "src/minheap"

export class PathFinder {

    public grid = {};
    public solution = {};
    public grid_min_x;
    public grid_max_x;
    public grid_min_y;
    public grid_max_y;
    public startNode;
    public endNode;


    constructor( grid , min_x, min_y, max_x, max_y , solution ) {
        this.grid = grid;
        this.solution = solution;
        this.grid_min_x = min_x;
        this.grid_min_y = min_y;
        this.grid_max_x = max_x;
        this.grid_max_y = max_y;
    }


    //------------------------------
    public heuristic( dx , dy ) {
        
        return Math.sqrt( dx * dx + dy * dy );
    }

    //----------------------
    public isWalkableAt( x , y ) {
    
        var ret = 0;
        if ( x >= this.grid_min_x && x <= this.grid_max_x && 
             y >= this.grid_min_y && y <= this.grid_max_y ) {

            var node = this.grid[ x + "," + y ];

            if ( node == null || typeof node == "undefined" ) {
                node = this.createNode( x,y );
            }
            ret = node["walkable"];
            
        }   
        return ret;
    }

    //--------------------
    public getNeighbors( node ) {

        var x = node["x"],
            y = node["y"],
            neighbors = [],
            s0 = false, 
            s1 = false, 
            s2 = false, 
            s3 = false ;


        // ↑
        if (this.isWalkableAt(x, y - 1) == 1 ) {
            neighbors.push( this.grid[ ( x + 0 ) + "," + (y - 1) ]  );
            s0 = true;
        }
        // →
        if (this.isWalkableAt(x + 1, y) == 1  ) {
            neighbors.push( this.grid[ ( x + 1 ) + "," + (y + 0) ] );
            s1 = true;
        }
        // ↓
        if (this.isWalkableAt(x, y + 1) == 1 ) {
             neighbors.push( this.grid[ ( x + 0 ) + "," + (y + 1) ] );
            s2 = true;
        }
        // ←
        if (this.isWalkableAt(x - 1, y ) == 1  ) {
             neighbors.push( this.grid[ ( x - 1 ) + "," + (y + 0) ] );
            s3 = true;
        }
        return neighbors;
    }



    //------------------
    public backtrace( node ) {

        while (node["parent"]) {
            
            let nextnode = node;
            node = node["parent"];
            
            this.markSolution( node["x"], node["y"] , nextnode["x"], nextnode["y"] );
        
        }
        
    }

    //-----------------------------------
    markSolution( sx, sy, ex, ey ) {

        this.solution[ sx + "," + sy ] = [ ex , ey ];
            
    }


    //------------
    getSolution( sx, sy )  {

        return this.solution[ sx + "," + sy ];
    }

    
     //--------
    public createNode( x, y ) {

        //log("createNode", x, y );

        var node = this.getNode( x, y ); 
        if ( node == null ) {
            node = {};
            node["x"] = x;
            node["y"] = y;
            node["walkable"] = 1;
        }

        node["opened"] = false;
        node["closed"] = false;
        node["parent"] = null ;
        this.grid[ x + "," + y ] = node;
                
        return node;
    }


    //-----------------------------
    public getNode( x,y ) {
        
        if ( typeof this.grid[ x + "," + y ] != "undefined" ){
            return this.grid[ x + "," + y ] ;
        }
        return null;
    }

    

    

    //----------
    public clearNodes() {
        let key;
        for ( key in this.grid ) {
           
            let node = this.grid[key];
            if ( node["walkable"] == 1 ) {
                
                node["closed"] = false;
                node["opened"] = false;
                node["parent"] = null;
               
            }
        }   
    }

    //-------------
    public reset() {
        let key;
        for ( key in this.grid ) {
            delete this.grid[key];
        }
        for ( key in this.solution ) {
            delete this.solution[key];
        }   
    }




    //---------------------
	public findPath(startX, startY, endX, endY ) {

        if ( startX == endX && startY == endY ) {
            return [];
        }

        this.clearNodes();
        this.startNode           = this.createNode( startX , startY );
        this.endNode             = this.createNode( endX   , endY   );
        var maxiteration        = 2000;

        // set the `g` and `f` value of the start node to be 0
        this.startNode["g"] = 0;
        this.startNode["f"] = 0;

        var openList = new MinHeap( function(a,b) {
            return a["f"] < b["f"];
        });

        // push the start node into the open list
        openList.push( this.startNode );
        
        var SQRT2 = Math.sqrt(2);

        // while the open list is not empty
        var iteration = 0;
        while ( openList.length() > 0  ) {

            
            // pop the position of node which has the minimum `f` value.
            

            var node = openList.pop();

            node["closed"] = true;

            
            // if reached the end position, construct the path and return it
            if (node === this.endNode ) {
                this.backtrace( this.endNode);
                return 1;
            }

            // get neigbours of the current node
            var neighbors = this.getNeighbors( node );

            if ( neighbors.length > 0 ) {

                var i ;
                for ( i = 0 ; i < neighbors.length ; ++i ) {

                    var neighbor = neighbors[i];

                    if (neighbor["closed"]) {
                        continue;
                    }

                    var nx = neighbor["x"];
                    var ny = neighbor["y"];

                    // get the distance between current node and the neighbor
                    // and calculate the next g score
                    var ng = node["g"] + (( nx - node["x"] === 0 || ny - node["y"] === 0) ? 1 : SQRT2);

                    // check if the neighbor has not been inspected yet, or
                    // can be reached with smaller cost from the current node
                    if (!neighbor.opened || ng < neighbor["g"]) {
                        neighbor["g"] = ng;
                        neighbor["h"] = neighbor["h"] || this.heuristic( Math.abs( nx - endX), Math.abs( ny - endY)   );
                        neighbor["f"] = neighbor["g"] + neighbor["h"];
                        neighbor["parent"] = node;

                        if (!neighbor["opened"]) {

                            openList.push(neighbor);
                            neighbor["opened"] = true;

                        } else {
                            // the neighbor can be reached with smaller cost.
                            // Since its f value has been updated, we have to
                            // update its position in the open list
                            neighbor["g"] = ng;
                        }
                    }

                
                
                } // end for each neighbor
            } else {
                // No neighbour from the first tile
                log("No neighbors since the first tile");
                break;
            }

            iteration += 1;
            if ( iteration >= maxiteration ) {
                log( "iteration over ", maxiteration );
                break;
            }

        } // end while not open list empty

        // fail to find the path
        return -1;

    }














   
}




