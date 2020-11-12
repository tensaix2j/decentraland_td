


import resources from "src/resources";


export class Txprojectile extends Entity {

	
	public id;
	public parent;


	public dst_v3;
	public src_v3;

	public visible = 1;
	public speed = 2.5;

	public attacktarget;
	
	public damage;
	public damage_building;

	public owner;

	public type;
	public tick = 0;
	public frame_index = 0;

	public dead = 3;
	public wait_buffer = 0;



	constructor( id, parent , shape, src_v3, dst_v3  , owner,  type, attacktarget ,  damage , damage_building ) {

		super();
		engine.addEntity(this);
		this.setParent( parent );

		this.id = id;
		this.parent = parent;
		this.type = type;
		this.attacktarget = attacktarget;
		
		this.damage = damage;
		this.damage_building = damage_building;

		this.owner  = owner;

		this.dst_v3 = dst_v3;
		this.src_v3 = src_v3;

		let transform = new Transform({
			position: this.src_v3
		});

		this.addComponent( transform );
		this.addComponent( shape );
		
	}


	//--------------
	move_self( dt ) {
		
		

		let transform = this.getComponent(Transform);
		let distance = Vector3.DistanceSquared(transform.position, this.dst_v3 ) // Check distance squared as it's more optimized

    	if (distance > 0.25 ) {

    		let direction = this.dst_v3.subtract(transform.position)
		    transform.rotation = Quaternion.LookRotation(direction)

    		let forwardVector = Vector3.Forward().rotate(transform.rotation)
      		let increment = forwardVector.scale(dt * this.speed );
      		transform.translate(increment)


	    } else {

	    	if ( this.type == 1 ) {
	    		// Arrow
		    	if ( this.attacktarget != null && this.attacktarget.dead == 0 ) {

		    		this.parent.sounds["arrowhit"].playOnce();
            		this.inflict_damage();
		    	}
	    	} else if ( this.type == 2 ) {
	    		// Wizard Fireball

	    		//    createExplosion( location_v3 ,  owner ,  scale_x , scale_y , explosion_type, damage , damage_building , wait_buffer ) {

	    		this.parent.createExplosion( 
	    			new Vector3( transform.position.x , transform.position.y, transform.position.z ), 
	    			this.owner, 
	    			1,
	    			1,
	    			1,
	    			this.damage,
	    			this.damage_building,
	    			0
	    		);
	    	} else if ( this.type == 3 ) {
	    		// Spell Fireball
	    		this.parent.createExplosion( 
	    			new Vector3( transform.position.x , transform.position.y, transform.position.z ), 
	    			this.owner, 
	    			5,
	    			5,
	    			1,
	    			this.damage,
	    			this.damage_building,
	    			0
	    		);

	    	}	


	    	this.owner = null;
	    	this.hide();

	    }
	}


	public frame_index_to_frame_x = [ 0 , 1, 2, 3,    0, 1, 2, 3,   0, 1, 2, 3 , 0 , 1, 2, 3 ];
	public frame_index_to_frame_y = [ 3 , 3, 3, 3,    2, 2, 2, 2,   1, 1, 1, 1 , 0 , 0 , 0 , 0];


	//-------
	getUV_coord() {

		let frame_x = this.frame_index_to_frame_x[ this.frame_index ];
		let frame_y = this.frame_index_to_frame_y[ this.frame_index ];

		if ( this.dead == 3 ) {
			frame_x = 5;
			frame_y = 5;
		}

		let arr = [
			frame_x	/4				,	frame_y /4,
			(frame_x + 1 )/4		,	frame_y /4,
			(frame_x + 1 )/4		,	(frame_y + 1 )/4,
			frame_x	/4				,	(frame_y + 1 )/4 ,
			frame_x	/4				,	frame_y /4,
			(frame_x + 1 )/4		,	frame_y /4,
			(frame_x + 1 )/4		,	(frame_y + 1 )/4,
			frame_x	/4				,	(frame_y + 1 )/4 
		]

		return arr;
	}



	//---
	inflict_damage() {

		if ( this.attacktarget != null ) {
			
			this.attacktarget.curhp -= this.damage;
			if ( this.attacktarget.curhp < 0 ) {
				this.attacktarget.curhp = 0;
			}
			//log( this.type, this.id , "hits " , this.attacktarget.type, this.attacktarget.id , " remaining hp = " , this.attacktarget.curhp , this.attacktarget.maxhp )
			this.attacktarget.refresh_hp();

			if ( this.attacktarget.curhp <= 0 ) {
				
				//log( this.type, this.id , " kills " , this.attacktarget.type, this.attacktarget.id );
				this.attacktarget.die();
				this.attacktarget = null;
			}
		}
	}
	

	//----------
	update(dt) {
		if ( this.visible == 1 ) {

			if ( this.dead == 0 ) {
				if ( this.type == 2 || this.type == 3 ) {
					this.frame_index = ( this.frame_index + 1 ) % 16;
					this.getComponent( PlaneShape ).uvs = this.getUV_coord();
				}
				this.move_self(dt);
			
			
			} else if ( this.dead == 3 ) {
				
				// Booting	
				this.tick += 1;
				if ( this.tick >= this.wait_buffer ) {
					this.dead = 0;
					this.tick = 0;
					
					if ( this.type == 1 ) {
						this.parent.sounds["arrowshoot"].playOnce();
					} else if ( this.type == 2 || this.type == 3 ) {
						this.parent.sounds["whoosh"].playOnce();
            		}

				}
 			}
		} else {
			this.tick += 1;
			if ( this.tick > 100 ) {
				this.parent.removeProjectile( this );
			}
		}
	}


	//----
	hide() {
		this.visible = 0;
		this.tick = 0;
		this.getComponent(Transform).position.y = -999;

	}
}




