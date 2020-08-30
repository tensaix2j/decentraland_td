



import {b2Vec2} from "src/Box2D/Common/b2Math"
import {b2BodyType} from "src/Box2D/Dynamics/b2Body"
import {b2AABB}  from "src/Box2D/Collision/b2Collision"
import {b2QueryCallback} from "src/Box2D/Dynamics/b2WorldCallbacks";



import resources from "src/resources";


export class Txexplosion extends Entity {

	
	public id;
	public parent;

	public transform;
	public visible_ypos;
	public visible = 1;

	public frame_index = 0;
	public tick = 0;
	public tick_per_frame = 1;


	public damage;
	public damage_building;

	public owner;

	public units_in_proximity = [];
	public box2daabb: b2AABB;
	public box2dcallback: b2QueryCallback;

	public type;
	public maxframe = 16;
	public attackframe = 3;

	public dead = 3;
	public wait_buffer = 0;

	constructor( id, parent , transform_args  , shared_material , owner, type,  damage ,  damage_building ) {

		super();
		engine.addEntity(this);
		this.setParent( parent );

		
		this.id = id;
		this.parent = parent;
		this.damage = damage;
		this.damage_building = damage_building;

		this.owner  = owner;
		this.type 	= type;

		this.transform =  new Transform( transform_args );
		this.addComponent( this.transform );
		this.addComponent( new PlaneShape() );
		this.addComponent( shared_material );

		this.getComponent( PlaneShape ).uvs = this.getUV_coord();

		this.visible_ypos = this.getComponent(Transform).position.y;

		if ( type == 1 ) {
			this.addComponent( new Billboard() );
		} else if ( type == 2 ) {
			this.transform.rotation.eulerAngles = new Vector3( 90, 0 , 0 );
			this.maxframe = 6;
			this.attackframe = 0;
		}
		

		this.tick = 0;
		this.frame_index = 0;

		let _this = this;
		this.box2daabb 		= new b2AABB();
		this.box2dcallback 	= new b2QueryCallback(); 
		this.box2dcallback.ReportFixture = function( evt ) { 

			if ( evt.m_body.m_userData != null ) {
				_this.units_in_proximity.push( evt.m_body.m_userData );
			}
			return true;
		};
			

	}


	public frame_index_to_frame_x = [ 0 , 1, 2, 3,    0, 1, 2, 3,   0, 1, 2, 3 , 0 , 1, 2,  3 ];
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


	//------
	find_nearby_units( ) {
		
		
		let _this = this;
		this.box2daabb.lowerBound = new b2Vec2( this.transform.position.x - this.transform.scale.x / 2  , this.transform.position.z - this.transform.scale.z / 2  );
		this.box2daabb.upperBound = new b2Vec2( this.transform.position.x + this.transform.scale.x / 2  , this.transform.position.z + this.transform.scale.z / 2  );
		this.units_in_proximity.length = 0;
		this.parent.world.QueryAABB( this.box2dcallback , this.box2daabb);
		
	}




	//----------
	update(dt) {

		if ( this.visible == 1 ) {
			
			if ( this.dead == 0 ) {

				if ( this.tick < this.tick_per_frame ) {
					this.tick += 1;
				} else {
					
					if ( this.frame_index + 1 >= this.maxframe ) {
						
						this.hide();

					} else {

						if ( this.frame_index == this.attackframe ) {

							this.find_nearby_units();
							// No attack target ? look for one within aggro range. 
							let i;
							for ( i = 0 ; i < this.units_in_proximity.length ; i++ ) {

								let u = this.units_in_proximity[i];
								
								if ( u != null && u.dead == 0 && u.owner != this.owner ) {
									
									let diff_x = u.transform.position.x - this.transform.position.x;
									let diff_z = u.transform.position.z - this.transform.position.z;

									let hypsqr = diff_x * diff_x + diff_z * diff_z;
									if ( hypsqr <= this.transform.scale.x * this.transform.scale.x ) {
										this.inflict_damage( u );
									}	
								}
							}

						} 
					
						this.frame_index = ( this.frame_index + 1 ) % this.maxframe ;
						this.getComponent( PlaneShape ).uvs = this.getUV_coord();
						this.tick = 0;
					}	
				}

			} else if ( this.dead == 3 ) {
				// Booting	
				this.tick += 1;
				if ( this.tick >= this.wait_buffer ) {

					if ( this.type == 1 ) {
						this.parent.sounds["explosion"].playOnce();
					} else if ( this.type == 2 ) {
						this.parent.sounds["electricshock"].playOnce();
					}
					this.dead = 0;
					this.tick = 0;
				}
			}

		} else {
		
			this.tick += 1;
			if ( this.tick > 100 ) {
				this.parent.removeExplosion( this );
			}
		}
		
	}


	//---
	inflict_damage( attacktarget ) {

		if ( attacktarget != null ) {
			
			if ( attacktarget.type == "tower" ) {

				attacktarget.curhp -= this.damage_building;
				//log( "explosition inflict damage building", attacktarget.id , this.damage_building , attacktarget.curhp );
				
			} else {
					
				attacktarget.curhp -= this.damage;
				//log( "explosition inflict damage", attacktarget.id , this.damage , attacktarget.curhp);
				
			}

			if ( attacktarget.curhp < 0 ) {
				attacktarget.curhp = 0;
			}
			//log( this.type, this.id , "hits " , this.attacktarget.type, this.attacktarget.id , " remaining hp = " , this.attacktarget.curhp , this.attacktarget.maxhp )
			attacktarget.refresh_hp();

			if ( attacktarget.curhp <= 0 ) {
				
				//log( this.type, this.id , " kills " , this.attacktarget.type, this.attacktarget.id );
				attacktarget.die();
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




