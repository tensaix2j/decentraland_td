



import {b2Vec2} from "src/Box2D/Common/b2Math"
import {b2BodyType} from "src/Box2D/Dynamics/b2Body"
import {b2AABB}  from "src/Box2D/Collision/b2Collision"
import {b2QueryCallback} from "src/Box2D/Dynamics/b2WorldCallbacks";


import resources from "src/resources";


export class Txunit extends Entity {

	
	public id;
	public parent;
	public transform;


	public box2dbody;

	public visible_ypos;
	public visible = 1;
	public shapetype ;
	public type;


	public walking_queue = [];
	public speed = 10;
	public owner;
	
	public attackRange;
	public attackSpeed = 30;
	
	public aggroRange = 1.5;
	public isFlying = 0;
	public attack_building_only = 0;
	public isSpawner = 0;



	public attacking = 0;
	public attacktarget:Txunit = null;
	public movetarget:Txunit = null;


	public curhp:number;
	public maxhp:number;

	public damage:number;
	
	public healthbar;

	public dead = 3;
	public tick;
	public wait_buffer;

	public clips = {};

	public skin_radius;
	public tower_shooter;

	public projectile_user = 0;
	
	public units_in_proximity = [];
	public box2daabb: b2AABB;
	public box2dcallback: b2QueryCallback;

	public box2d_transform_args;


	constructor( id, parent , transform_args, box2d_transform_args,  model , type, shapetype , owner, isFlying, aggroRange , healthbar_y , wait_buffer, model2 ) {

		super();
		engine.addEntity(this);
		this.setParent( parent );


		this.id = id;
		this.parent = parent;
		this.transform = new Transform( transform_args );
		this.owner = owner;
		this.isFlying = isFlying ;
		this.aggroRange = aggroRange;
		this.type = type;
		this.shapetype = shapetype;
		this.dead = 3;

		this.box2d_transform_args = box2d_transform_args;
		

		this.addComponent( this.transform );
		this.addComponent( model );
		
	

        let healthbar_material = new Material();
        healthbar_material.specularIntensity = 0;
        healthbar_material.roughness = 1.0;
        let healthbar = new Entity();
        healthbar.setParent( this );
		healthbar.addComponent( new PlaneShape() );
		healthbar.addComponent( new Transform({
			position: new Vector3(  0,    healthbar_y,   0),
			scale   : new Vector3(1.5,   0.2,   0.2)
		}));
		healthbar.addComponent( new Billboard() );
		healthbar.addComponent( healthbar_material );
		this.healthbar = healthbar;



		
		
		this.skin_radius = box2d_transform_args.scale.x;
		
		this.addComponent( new Animator );

		// Includes towerarcher, towerwizard, towergoblinspear
		if ( this.type.substr(0,5) == "tower" ) {

			let tower_shooter = new Entity();
			tower_shooter.setParent(this);
			tower_shooter.addComponent( model2 );
			tower_shooter.addComponent( new Animator );

			let tax = 0;
			let tay = 0.74;
			let taz = 0;

			tower_shooter.addComponent( new Transform( {
				position: new Vector3( tax, tay , taz),
				scale   : new Vector3( 0.2, 0.2, 0.2 )
			}));
			
			this.tower_shooter = tower_shooter;
			this.healthbar.getComponent(Transform).position.y = 1.45;
			this.healthbar.getComponent(Transform).scale = new Vector3( 0.4,  0.05, 0.2);
			
			
		}


		
		this.createAnimationStates();


		let _this = this;
		this.box2daabb 		= new b2AABB();
		this.box2dcallback 	= new b2QueryCallback(); 
		this.box2dcallback.ReportFixture = function( evt ) { 

			if ( evt.m_body.m_userData != null ) {
				_this.units_in_proximity.push( evt.m_body.m_userData );
			}
			return true;
		};
		


		
		 if ( this.owner == 1 ) {
        	this.healthbar.getComponent( Material ).albedoColor = Color3.FromInts( 255, 0, 0 );
	    } else {
	    	this.healthbar.getComponent( Material ).albedoColor = Color3.FromInts( 0, 0, 200 );
	    }
		this.attacktarget = null ;
		this.movetarget   = null ;
		this.attacking    = 0;
		this.tick  		  = 0;
		this.wait_buffer  = wait_buffer;
		this.visible_ypos = this.transform.position.y;
		//this.getComponent(GLTFShape).visible = true;

		
	}




	//-------------------
    createAnimationStates() {
        
        if ( this.type.substr(0,5) == "tower" ) {
        	
        	this.getComponent(Animator).addClip( new AnimationState("ArmatureAction") );
			this.getComponent(Animator).getClip("ArmatureAction").playing = true;

			this.tower_shooter.getComponent(Animator).addClip( new AnimationState("Punch") );
			this.tower_shooter.getComponent(Animator).addClip( new AnimationState("_idle") );
			

        } else if ( this.isSpawner == 0 ) {


        	this.getComponent(Animator).addClip( new AnimationState("_idle") );
			this.getComponent(Animator).addClip( new AnimationState("Walking") );
			this.getComponent(Animator).addClip( new AnimationState("Punch") );
			this.getComponent(Animator).addClip( new AnimationState("Die") );
   			
			this.stopAnimation("_idle");
			this.stopAnimation("Punch");
			this.stopAnimation("Die");
			this.playAnimation("Walking", 1 );
   			//log( this.id , "createAnimationStates" );	

   		}

    }



    //----------
    refresh_hp() {
    	
    	let hp_perc = this.curhp / this.maxhp ;
		this.healthbar.getComponent( Transform ).scale.x = hp_perc * 1.5;
		
			

    }

	

	//------------------
	// Bookmark
	update( dt ) {



		if ( this.visible == 1 ) {

			if ( this.dead == 0 ) {

				if ( this.parent.game_state == 1 ) {
					
					// My tower
					if ( this.shapetype == "static" ) {
						this.find_attack_target();
						this.attack_target();

					} else {
						// Mob
						if ( this.attacking == 0 ) {
								
							if ( this.shapetype == "dynamic" ) {
								this.find_move_target();
								this.move_self( dt );
							}
						}
						this.updatePosition_toBox2d();
					}
				
				}
			
			} else if ( this.dead == 3 ) {
				// Booting	
				this.tick += 1;
				if ( this.tick >= this.wait_buffer ) {

					this.reinstate_box2d( this.box2d_transform_args );
					this.dead = 0;
					this.tick = 0;
				}
 
			} else {
				// Dying
				this.die_and_rot();
			}

		} else {
			this.tick += 1;
			if ( this.tick > 100 ) {
				this.parent.removeUnit( this );
			}
		}
	}


	//----------------
	die_and_rot() {
		// Dead ones, move to below 
		if ( this.dead == 1 ) {

			let dst       		=  this.transform.scale.y * -1;
			let start_remaining =  this.visible_ypos - dst;
			let remaining 		=  this.transform.position.y - dst;

			if ( remaining > 0 ) {
				this.transform.position.y -=  start_remaining / 100;
			} else {
				
				this.dead = 2;
				this.stopAllClips();
				//this.getComponent(GLTFShape).visible = false;
				this.hide();

			}
		}
	}




	//----
	find_move_target() {

		// Dont have programmed route to go.
		if ( this.walking_queue.length == 0 ) {

			// What tile am i in
			let tile_x = Math.round( ( this.box2dbody.GetPosition().x  ) / this.parent.grid_size_x ) >> 0 ;
			let tile_z = Math.round( ( this.box2dbody.GetPosition().y  ) / this.parent.grid_size_z ) >> 0 ;

			// This tile in in pathfinder's solution or not
			let node = this.parent.pathfinder.getNode( tile_x, tile_z );
			if ( node != null  && node["child"] != null ) {

				// is in, figure out tile's center;
				let next_cx = node["child"]["x"] * this.parent.grid_size_x ;
				let next_cz = node["child"]["y"] * this.parent.grid_size_z ;

				this.walking_queue.push( new Vector3( next_cx , 0 , next_cz ) ) ;

			} 
		}
	}

	//-------
	move_self( dt ) {

		let tile_x = Math.round( ( this.box2dbody.GetPosition().x  ) / this.parent.grid_size_x ) >> 0 ;
		let tile_z = Math.round( ( this.box2dbody.GetPosition().y  ) / this.parent.grid_size_z ) >> 0 ;

		if ( tile_x >= 7  || tile_z >= 7 ) {
			// Reached destination.
			this.parent.sounds["pop"].playOnce();
			this.die();
			return ;
		}




		if ( this.walking_queue.length > 0 ) {

			var target = this.walking_queue[0];
			

			let togo_tile_x = Math.round( ( target.x  ) / this.parent.grid_size_x ) >> 0 ;
			let togo_tile_z = Math.round( ( target.z  ) / this.parent.grid_size_z ) >> 0 ;
			let node = this.parent.pathfinder.getNode( togo_tile_x, togo_tile_z );
			if (  node != null && node["walkable"] != 1 ) {
					
				this.walking_queue.length = 0;
				this.parent.pathfinder.findSubPath( tile_x, tile_z, 7, 0 );


			} else {

				let diff_x = target.x -  this.box2dbody.GetPosition().x;
		    	let diff_z = target.z -  this.box2dbody.GetPosition().y;
		    	
		    	var hyp = diff_x * diff_x + diff_z * diff_z ;

		    	if ( hyp > this.speed * this.speed * dt * dt  ) {
		    		
		    		
		    		var rad	 = Math.atan2( diff_x, diff_z );
		    		var deg  = rad * 180.0 / Math.PI ;
		    		var delta_x = this.speed * dt * Math.sin(rad);
		    		var delta_z = this.speed * dt * Math.cos(rad);

		    		this.box2dbody.SetLinearVelocity( new b2Vec2( delta_x ,delta_z ) );

		    		this.transform.rotation.eulerAngles = new Vector3( 0, deg ,0) ;

		    		this.getComponent(Animator).getClip("Punch").playing = false;
					this.getComponent(Animator).getClip("Walking").playing = true;



		    	
		    	} else {

		    		this.walking_queue.shift();
		    		if ( this.walking_queue.length == 0 ) {
		    			
		    			this.movetarget = null;
		    			this.find_move_target();
		    		}
		    	}
	    	}

	    } 

	}

		
	//---
	die() {

		if ( this.parent.game_state == 1 ) {

			if ( this.shapetype == "static" ) {

				//    createExplosion( location_v3 ,  owner ,  scale_x , scale_y , explosion_type, damage , damage_building , wait_buffer) {

				this.parent.createExplosion( 
	    			new Vector3( this.transform.position.x , this.transform.position.y, this.transform.position.z ), 
	    			this.owner,
	    			3,    //scalex
	    			3,    //scaley
	    			1,    //type
	    			0,    //dmg
	    			0,     //dmg_b
	    			0  		//waitbuffer
	    		);
			} 
			
			this.stopAnimation("Walking");
			this.stopAnimation("Punch");
			this.stopAnimation("_idle");
			this.playAnimation("Die", 0 );

			this.dead = 1;
			this.parent.world.DestroyBody( this.box2dbody );
			this.parent.unit_on_die( this );

			if ( this.shapetype == "static" ) {
				this.parent.sounds["destruction"].playOnce();
			} else {
				if ( this.type == "knight" || this.type == "prince" || this.type == "archer" || this.type == "wizard" || this.type == "giant" ) {
					this.parent.sounds["scream"].playOnce();
				}
				this.parent.sounds["organicdie"].playOnce();
			}
		}
	}


	//-----------
	spawn_unit() {

		if ( this.tick <= 0 ) {
			
			this.tick = this.attackSpeed;
			if ( this.type == "goblinhut" ) {
				this.parent.createUnit( "goblinspear" , this.transform.position.x,  this.transform.position.z, this.owner , 48 ) ;
			
			} else if ( this.type == "tombstone" ) {
				this.parent.createUnit( "skeleton" , this.transform.position.x,  this.transform.position.z, this.owner , 48) ;
			}


		} else {
			this.tick -= 1;
		
			this.curhp -= 1;
			if ( this.curhp <= 0 ) {
				this.curhp = 0;
			}
			this.refresh_hp();
			if ( this.curhp <= 0 ) {
				this.die();
			}
		}
						
	}


	//----
	attack_target() {

		// Has attack target.
		if ( this.attacktarget != null  ) {

			// attacktarget not dead.
			if ( this.attacktarget.dead == 0 ) {
				// has target
				// Check attack target is it in range.
				let diff_x =  this.attacktarget.transform.position.x - this.transform.position.x;
				let diff_z =  this.attacktarget.transform.position.z - this.transform.position.z;
				let hyp    =  diff_x * diff_x + diff_z * diff_z ;
				
				let use_attackRange = this.attackRange + this.attacktarget.skin_radius ;
									

				if ( hyp >  use_attackRange * use_attackRange ) {

					// attack target not in range. need not to do anything.
					this.attacking = 0;
					//this.attacktarget = null ;

					if ( this.walking_queue.length == 0 ) {
						this.find_path_to_target();
					}

				} else { 

					if ( this.attacking == 0 ) {
						
						// Attack target is in attack range, attack now.
						this.walking_queue.length = 0;
						this.box2dbody.SetLinearVelocity( new b2Vec2(0,0) );
						this.attacking = this.attackSpeed;
						this.tick = this.attackSpeed;


							
					}


					
					// At t0
					if ( this.tick == this.attackSpeed ) {

						this.stopAnimation("Walking" );	
						this.stopAnimation("_idle" );	
						this.stopAnimation("Die");
						this.playAnimation("Punch", 0 );
						this.lookat_target( diff_x , diff_z );
							
						// Projectile shooter
						if ( this.projectile_user == 1 ) {

							let srcx, srcy, srcz;

							if ( this.type.substr(0,5) == "tower" ) {

								srcx = this.transform.position.x + this.tower_shooter.getComponent(Transform).position.x;
								srcy = this.transform.position.y + this.tower_shooter.getComponent(Transform).position.y + 0.14;
								srcz = this.transform.position.z + this.tower_shooter.getComponent(Transform).position.z;
							
							} else  {

								srcx = this.transform.position.x;
								srcy = this.transform.position.y + 0.14;
								srcz = this.transform.position.z;
							}

							let dstx = this.attacktarget.transform.position.x;
							let dsty = this.attacktarget.transform.position.y;
							let dstz = this.attacktarget.transform.position.z;

							let projectile_type = 1;
							if ( this.type == "wizard" || this.type == "towerwizard" ) {
								projectile_type = 2;
							}

							

							//createProjectile( src_v3, dst_v3 , owner , projectile_type , attacktarget, damage , damage_building ) {

							this.parent.createProjectile( 
									new Vector3( srcx, srcy, srcz) , 
									new Vector3( dstx, dsty, dstz) , 
									this.owner, 
									projectile_type,
									this.attacktarget,
									this.damage,
									this.damage,
									0
							);
						} 


					// At t 1/2
					} else if ( this.tick == ( this.attackSpeed / 2 ) >> 0 ) {

						if ( this.projectile_user == 0 ) {
							// Melee
							if ( this.type == "knight" || this.type == "pekka") {	
								this.parent.sounds["swordhit"].playOnce();
							} else if ( this.type == "skeleton" ) {
								this.parent.sounds["skeletonhit"].playOnce();	
							
							} else {
								this.parent.sounds["punch"].playOnce();
							}

							this.box2dbody.SetLinearVelocity( new b2Vec2(0,0 ) );
							this.box2dbody.ApplyLinearImpulse( new b2Vec2(0.001,  0) , this.box2dbody.GetWorldCenter() );

							// Melee
							this.inflict_damage();
						}

					} 


					// At t end	
					if ( this.tick <= 0 ) {
						this.tick = this.attackSpeed;
					} else {
						this.tick -= 1;
					}

				}

			} else {
				// has attack target, but attack target isdead .

				if ( this.attacking > 0 ) {
					this.attacking -= 1;

				} else {
					this.attacktarget = null;
					this.movetarget = null;
					this.walking_queue.length = 0;
					this.attacking = 0;
					if ( this.shapetype == "dynamic" ) {
						
						this.stopAnimation("Punch");
						this.stopAnimation("_idle");
						this.stopAnimation("Die");
						this.playAnimation("Walking", 1 );

					}
				}

			}
		} else {
			if ( this.attacking > 0 ) {
				this.attacking -= 1;
			}
		}

	}

	//---
	lookat_target( diff_x , diff_z ) {

		var rad	 = Math.atan2( diff_x, diff_z );
		var deg  = rad * 180.0 / Math.PI ;
				
		if ( this.type.substr(0,5) != "tower" ) {
			this.transform.rotation.eulerAngles = new Vector3( 0, deg ,0) ;

		} else  {
			let tower_shooter_transform = this.tower_shooter.getComponent(Transform);
			tower_shooter_transform.rotation.eulerAngles = new Vector3( 0, deg ,0) ;
		}
	}	

	//---
	inflict_damage() {

		//log( this.id, "inflict_damage ");

		if ( this.attacktarget != null ) {
			
			this.attacktarget.curhp -= this.damage;
			if ( this.attacktarget.curhp < 0 ) {
				this.attacktarget.curhp = 0;
			}
			//log( this.type, this.id , "hits " , this.attacktarget.type, this.attacktarget.id , " remaining hp = " , this.attacktarget.curhp , this.attacktarget.maxhp )

				
			this.attacktarget.refresh_hp();

			if ( this.attacktarget.curhp <= 0 ) {
				
				//log( this.id , "inflict damage, target killed.");
				//log( this.type, this.id , " kills " , this.attacktarget.type, this.attacktarget.id );
				this.attacktarget.die();
				this.attacktarget = null;
				this.movetarget   = null;

				

			}
		}
	}
	
	//------------------
	reinstate_box2d( box2d_transform_args ) {

		if ( this.shapetype == "static" ) {

			this.box2dbody = this.parent.createStaticBox(  
	    				this.transform.position.x ,  
	    				this.transform.position.z ,  
	    				box2d_transform_args.scale.x ,
	    				box2d_transform_args.scale.z , 
	    				this.parent.world
	    	);


		} else {
			this.box2dbody = this.parent.createDynamicCircle(  
	    				this.transform.position.x ,  
	    				this.transform.position.z ,  
	    				box2d_transform_args.scale.x , 
	    				this.parent.world, 
	    				false 
	    	);

	    }
	   	this.box2dbody.m_userData = this ;


	   	// Box2d's collision grouping
    	let categoryBits = 1;
    	let maskBits 	 = 1;

	   	if ( this.isFlying == 1 ) {
    		categoryBits = 2;
    		maskBits     = 2;
    	}
    	this.box2dbody.m_fixtureList.m_filter.categoryBits = categoryBits;
		this.box2dbody.m_fixtureList.m_filter.maskBits     = maskBits;

	   	this.updatePosition_toBox2d();
		
	}


	//------
	find_nearby_units( search_range ) {
		
		
		let _this = this;
		this.box2daabb.lowerBound = new b2Vec2( this.transform.position.x - search_range  , this.transform.position.z - search_range  );
		this.box2daabb.upperBound = new b2Vec2( this.transform.position.x + search_range  , this.transform.position.z + search_range  );
		this.units_in_proximity.length = 0;
		this.parent.world.QueryAABB( this.box2dcallback , this.box2daabb);
		
	}



	//----
	find_attack_target() {


		if ( this.attacktarget == null ) {
			
			//log( "units_in_proximity", this.units_in_proximity.length );	
				
			

			this.find_nearby_units( this.aggroRange );
			

			// No attack target ? look for one within aggro range. 
			let i;
			let nearest_u = null;
			let nearest_hypsqr = 999;
			

			for ( i = 0 ; i < this.units_in_proximity.length ; i++ ) {

				let u = this.units_in_proximity[i];

				let hit_flying_unit_check = 1;
				if ( u.isFlying == 1 ) {
					if ( this.projectile_user == 0 ) {
						hit_flying_unit_check = 0;	
					}
					if ( this.isFlying == 1 ) {
						hit_flying_unit_check = 1;
					}
				}

				let hit_building_check = 1;
				if ( this.attack_building_only == 1 ) {
					if ( u.shapetype == "dynamic" ) {
						hit_building_check = 0;
					}
				}


				if ( u != null && u.owner != this.owner && u.dead == 0 && hit_flying_unit_check == 1 &&  hit_building_check == 1 ) {

					let diff_x =  u.transform.position.x - this.transform.position.x;
					let diff_z =  u.transform.position.z - this.transform.position.z;
					let hypsqr    =  diff_x * diff_x + diff_z * diff_z ;

					if ( hypsqr <=  this.aggroRange * this.aggroRange ) {

						if ( hypsqr < nearest_hypsqr ) {
							nearest_u = u;
							nearest_hypsqr = hypsqr;
						}
					}
				}
			}
			if ( nearest_u != null ) {
				this.attacktarget = nearest_u;
				this.movetarget   = this.attacktarget;


				//log( this.id, "new target found" , this.attacktarget.id );
				
				this.find_path_to_target();
			}

		} else {
			// Already has attack target, no need to find another one.
		}
	}




	//-----
    find_path_to_target( ){

    	if ( this.movetarget == null ) {
    		return ;
    	}

    	this.walking_queue.length = 0 ;
    	let target;

    	let target_at_otherside = 0;
    	if ( ( this.transform.position.z < 0 && this.movetarget.transform.position.z > 0) || ( this.transform.position.z > 0 && this.movetarget.transform.position.z < 0 ) ) {
    		target_at_otherside = 1;
    	}
    	

    	if ( this.isFlying == 0 && ( this.owner == 1 && this.movetarget.transform.position.z > 0  || this.owner == -1 && this.movetarget.transform.position.z < 0 ) ) {






	    	// Walk around own middle castle 
	    	if (  target_at_otherside == 1 && (  ( this.owner == 1 && this.transform.position.z < -6.7 )  ||  ( this.owner == -1 && this.transform.position.z > 6.7 )  )   && this.transform.position.x > -1 && this.transform.position.x < 1 ) {
	    		
	    		target = new Vector3(0,0,0);
	    		target.z = -1.5 * this.owner;

	    		if ( this.transform.position.x < 0 ) {
		    		target.x = -3;
		    	} else {
		    		target.x = 3;
		    	}

		    	this.walking_queue.push( target );
			





		    // Walk around own side castle
			} else if ( target_at_otherside == 1 && (  ( this.owner == 1 && this.transform.position.z < -4.55 ) ||  ( this.owner == -1 && this.transform.position.z > 4.55) ) ) {

				target = new Vector3(0,0,0);
	    		target.z = -1.5 * this.owner;
	    		
	    		if ( this.transform.position.x < 0 ) {
					if ( this.transform.position.x < -3  ) {
						target.x = -4;
					} else {
						target.x = -2;
					}
				} else {
					if ( this.transform.position.x > 3  ) {
						target.x = 4;
					} else {
						target.x = 2;
					}
				}
				this.walking_queue.push( target );
			}

	    	// Bridge target
	    	if (  target_at_otherside == 1 && ( ( this.owner == 1 && this.transform.position.z < -0.5 ) || ( this.owner == -1 && this.transform.position.z > 0.5 ) )) {

	    		target = new Vector3(0,0,0);
	    		target.z = this.owner * -0.5;

	    		if (  this.transform.position.x < 0 ) {
		    		target.x = -3;
		    	} else {
		    		target.x = 3;
		    	}
		    	this.walking_queue.push( target );


		    	target = new Vector3(0,0,0);
	    		target.z = this.owner * 0.5;

	    		if (  this.transform.position.x < 0 ) {
		    		target.x = -3;
		    	} else {
		    		target.x = 3;
		    	}
		    	this.walking_queue.push( target );


		    } 
		}
    	
    	// The actual target.
    	
    	//target = new Transform();
    	//target.position.x = this.attacktarget.transform.position.x;
    	//target.position.z = this.attacktarget.transform.position.z;
    	target = this.movetarget.transform.position;
    	this.walking_queue.push( target );

    	// This can cause problem
    	//this.playAnimation("Walking", 1);
    	


    }


	//------
	updatePosition_toBox2d()  {

		this.transform.position.x = this.box2dbody.GetPosition().x;
    	this.transform.position.z = this.box2dbody.GetPosition().y;
    	
    }






    
    public clip_names = ["_idle", "Walking", "Die", "Punch"];


    //------------
    playAnimation( action_name, loop ) {

    	
    	//log( this.id, "playAnimation " , action_name , loop );
    	
    	/*
    	let i;
		for ( i = 0 ; i < this.clip_names.length ; i++ ) {
			if ( this.clip_names[i] != action_name ) {
				this.stopAnimation( this.clip_names[i]);
			}
		}
		*/

		
		//log( this.type , this.id , "Attempt to play" , action_name , loop );
		let clip;
		if ( action_name == "Punch" && this.type.substr(0,5) == "tower" ) {
			clip = this.tower_shooter.getComponent(Animator).getClip( action_name );
		} else {
			clip = this.getComponent(Animator).getClip(action_name);
    	}
    	
    				
		if ( loop == 1  ) {
    		clip.looping = true;
    	} else {
    		clip.looping = false;
    	}

    	if ( action_name == "Punch" ) {
    		clip.speed = 30.0 / this.attackSpeed ;
    	} else {
    		clip.speed = 1.0;
    	}
    	
    	clip.reset();
		clip.playing = true;
		
		
    }

    stopAnimation( action_name ) {
    	
    	//log( this.type , this.id , "Attempt to stop" , action_name );
    	let clip;
    	if ( action_name == "Punch" && this.type.substr(0,5) == "tower" ) {
			clip = this.tower_shooter.getComponent(Animator).getClip( action_name );
		} else if ( action_name == "_idle" && this.type == "tower" ) {
			clip = this.tower_shooter.getComponent(Animator).getClip( action_name );
		} else {
			clip = this.getComponent(Animator).getClip(action_name);
    	}
    	clip.playing = false;
    	
    }
	
    //--
	stopAllClips() {
		
		let i;
		for ( i = 0 ; i < this.clip_names.length ; i++ ) {
			this.stopAnimation( this.clip_names[i]);
		}
	}


     //---
    hide() {
    	this.transform.position.y = -999;
    	this.visible = 0;
    	this.tick = 0;
    	
    }
    
}