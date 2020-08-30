



import resources from "src/resources";
import { Utils}     from "src/utils";


//----------------------------
// UpdateSystem callback 
export class UpdateSystem implements ISystem {

	public tables;
    
    constructor( tables, camera ) {

    	this.camera = camera;
        this.tables = tables;

    }

    //Executed ths function on every frame
    update(dt: number) {
        
        this.tables[0].update( dt  );

    }
}
