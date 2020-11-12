


import {b2Vec2} from "src/Box2D/Common/b2Math"
import {b2World} from "src/Box2D/Dynamics/b2World"
import {b2QueryCallback} from "src/Box2D/Dynamics/b2WorldCallbacks";


import {b2BodyDef}  from "src/Box2D/Dynamics/b2Body"
import {b2FixtureDef}  from "src/Box2D/Dynamics/b2Fixture"
import {b2PolygonShape}  from "src/Box2D/Collision/Shapes/b2PolygonShape"
import {b2CircleShape}  from "src/Box2D/Collision/Shapes/b2CircleShape"
import {b2BodyType} from "src/Box2D/Dynamics/b2Body"
import {b2RevoluteJointDef} from "src/Box2D/Dynamics/Joints/b2RevoluteJoint"
import {b2DistanceJointDef} from "src/Box2D/Dynamics/Joints/b2DistanceJoint"
import {b2ContactListener} from "src/Box2D/Dynamics/b2WorldCallbacks"
import {b2AABB}  from "src/Box2D/Collision/b2Collision"


import resources from "src/resources";
import { Txunit } from "src/txunit";
import { Txcard } from "src/txcard";
import { Txprojectile } from "src/txprojectile";
import { Txexplosion } from "src/txexplosion" ;
import { Txclock } from "src/txclock";
import { Txscoreboard } from "src/txscoreboard";
import { Txclickable_box} from "src/txclickable_box";
import { Txsound } from "src/txsound";
import { EmitArg } from "src/txemit_args";
import {PathFinder} from "src/pathfinder";
import {Utils} from "src/utils"
import { getUserAccount, RPCSendableMessage  } from '@decentraland/EthereumController'


export class Txstage extends Entity {

	public id;
	public userID;
	public transform;
	public camera;
	public world;
	public units = [];
	public battleground;
	public playerindex = 1;

	public card_sel_highlight;
	public card_sel_index = 0;

    public projectiles = [];
    public explosions = [];
    public clocks = [];

    
    public shared_fireball_shape;
    public shared_fireball_material;
    public shared_box;

    public shared_explosion_material;
    public shared_clock_material;
    public shared_zap_material;
    public shared_levelbadge_material;
    public shared_billboard;


    public uitxt_life ;
    public uitxt_instruction;
    public uitxt_time ;
    public uitxt_mana;
    public uiimg_selected_card;
    public uitxt_selected_card_mana;

    public uiimg_redflag;
    public uiimg_blueflag;
    public uiimg_selected_unit_photo;


   


    public buttons = {};

    public uiimage_manabar ;

    public game_state = 0;
    public game_mode  = 0;
        

    public menu_page  = 0;
    public menu_labels = {};

    
    public ui3d_root;


    public card_sel_parent ;
    public player_cards_collection = [];
    public player_cards_in_use    = [];
    public txcard_selected:Txcard = null ;

    public animate_button_tick = 0;
    public animate_button_callback_id = "";
    public animate_button_userdata = "";


    public sounds = {};

   

    public cards_dealt_in_game = 8;
    public monster_cycle_wait_time = 10;

    public scoreboard;

    public tick = 0;
    public globaltick = 0;

    

    public messageBus ;
    public emitBus      = [];
    public isHost       = 0;
    public isClient     = 0;
    public opponent     = "";
    public available_gamehosts = {}    
    public isReady      = 0;
    public isOpponentReady = 0;
    public synctick     = 0;

    public need_select_n_card = 4;
    public release_monster_tick = 0;
    public release_monster_count = 0;

    public pathfinder;


    public current_mana = 80;
    public current_wave = 0; 

    public current_selected_unit;
    public current_selected_unit_highlight;

    public difficulty = 0.2;

    
    public time_remaining = this.monster_cycle_wait_time;
    public life_remaining = 20;



    public debugsetting = 0;



	constructor( id, userID , transform_args , camera ) {

		super();
		engine.addEntity(this);

		this.id = id;
		this.userID = userID;
		this.transform = new Transform( transform_args );
		this.camera = camera;

		this.addComponent(  this.transform );
	   
	   
        let ground = new Entity();
        ground.setParent(this );
        ground.addComponent( resources.models.ground );
        ground.addComponent( new Transform(
            {
                position: new Vector3( 0, 1.41 ,0 ),
                scale   : new Vector3( 1, 1, 1 )
            }
        ));
        this.battleground = ground;
            

        let gravity   = new b2Vec2(0, 0);
        this.world     = new b2World( gravity );

        
        let _this = this;



        this.construct_box2d_shapes();
       
    	
    	
        this.battleground.addComponent( 
			new OnPointerDown((e) => {
				_this.global_input_down( e );	
			})
		);
		this.battleground.addComponent( 
			new OnPointerUp((e) => {
				_this.global_input_up( e );	
			})
		);


        this.current_selected_unit_highlight = new Entity();
        this.current_selected_unit_highlight.setParent( this );
        this.current_selected_unit_highlight.addComponent( new PlaneShape() );
        this.current_selected_unit_highlight.addComponent( new Transform( 
            {
                position: new Vector3(0, 1.5 ,0),
                scale   : new Vector3( 1.1, 1.1, 1.1)
            }
        ));
        this.current_selected_unit_highlight.getComponent(Transform).rotation.eulerAngles = new Vector3(-90,0,0);
        let material = new Material();
        material.emissiveColor = Color3.FromInts(0,255,0);
        material.emissiveIntensity = 4.0;
        this.current_selected_unit_highlight.addComponent( material );
        this.current_selected_unit_highlight.getComponent( PlaneShape).visible = false;
        this.current_selected_unit_highlight.getComponent( Transform ).position.y = -999;




        this.init_ui_2d();
        this.init_ui_3d();
        this.init_shared_material();
        this.init_sound();
        this.init_player_cards_collection();
        this.init_MessageBus();
        this.init_pathfinder();
        this.update_button_ui();

        this.debug();

    }   

















    public tile_x_size = 1;
    public tile_z_size = 1;
    public tile_x_gap  = 0.075;
    public tile_z_gap  = 0.075;

    public grid_size_x =  this.tile_x_size + this.tile_x_gap;
    public grid_size_z =  this.tile_z_size + this.tile_z_gap;


    //-------------
    debug( ) {


        this.debugsetting = 0;

        if ( this.debugsetting == 1 ) {

            //this.card_input_down( null, this.player_cards_collection[3] );
            //this.createExplosion( new Vector3(0,2,0) , 1 , 1 );
            // this.createClock( new Vector3(0,2,0 ) );
            

            /*
            let ruler_x = -6.5 * this.grid_size_x;
            let ruler_y = 1.41 ;
            let ruler_z =  1.5 * this.grid_size_z ;

            let ruler = new Entity();
            ruler.setParent(this);
            ruler.addComponent( new Transform( 
                {
                    position: new Vector3(  ruler_x , ruler_y ,  ruler_z ),
                    scale   : new Vector3( 0.01,  2 , 0.5  )
                }
            ));
            ruler.addComponent( new BoxShape() );

            ruler = new Entity();
            ruler.setParent(this);
            ruler.addComponent( new Transform( 
                {
                    position: new Vector3(  ruler_x , ruler_y,  ruler_z ),
                    scale   : new Vector3( 0.5,  2 , 0.01  )
                }
            ));
            ruler.addComponent( new BoxShape() );
            */


            
            this.sounds["medieval"].stop();
            this.sounds["warhorn"].playOnce();

            let i, j;
              
            this.game_state = 1;
            this.game_mode  = 1;
            this.life_remaining = 20;


            for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {
                this.player_cards_in_use.push(  this.player_cards_collection[i] );
            }

            this.time_remaining = 10000000;


            this.cards_dealt_in_game = this.player_cards_collection.length;
            
            this.queue_command( [ "spawnUnit", "skeleton" , -7.3 + Math.random() * 0.05 , Math.random() - 0.5 , -1 ] );
            this.units[0].rage = 1;



            this.rearrange_cards_selected();
            this.update_button_ui();



        }
           

    }   







    //-------------------------
    //
    //
    //          Updates
    //
    //
    //-----------------------------



    //----------------
	step(dt:number) {
    	
    	this.world.Step( 0.05  , 10, 10 );
    	
    }


    //--
    // Bookmark update()

    update(dt) {
    	
            

        if ( this.game_state == 1 || this.game_state == 2 ) {
    
            this.step(dt);
            
            let u;
            for ( u = 0 ; u < this.units.length ; u++) {
                let unit = this.units[u];
                if ( unit != null  ) {
                    unit.update(dt);
                } 
            }

            let p;
            for ( p = 0 ; p < this.projectiles.length ; p++ ) {
                let projectile = this.projectiles[p];
                if ( projectile != null  ) {
                    projectile.update(dt);
                }
            }

            let exp;
            for ( exp = 0 ; exp < this.explosions.length ; exp++ ) {
                let explosion = this.explosions[exp];
                if ( explosion != null  ) {
                    explosion.update(dt);
                }
            }
             

            let cl;
            for ( cl = 0 ; cl < this.clocks.length ; cl++ ) {
                let clock = this.clocks[cl];
                if ( clock != null  ) {
                    clock.update(dt);
                }
            }

        

            this.update_mana();
            this.update_score();
            this.update_time();
            
            if ( this.game_mode == 1 && this.game_state == 1  ) {
                
                if ( this.release_monster_tick > 0 ) {

                    if ( this.release_monster_tick % 10 == 0 && this.release_monster_count < this.get_monster_count_by_wave() ) {

                        let monster_type = this.get_monster_type_by_wave();
                        this.queue_command( [ "spawnUnit", monster_type , -7.3 + Math.random() * 0.05 , Math.random() - 0.5 , -1 ] );

                        this.release_monster_count += 1;
                    }
                    this.release_monster_tick -= 1; 
                }


            } else if ( this.game_mode == 2 && this.game_state == 1 ) {

                this.synctick += 1;
                if ( this.synctick > 100 ) {    
                    let params  = {
                        userID      : this.userID,
                        recipient   : this.opponent,
                        data: [ this.globaltick, this.time_remaining ]
                    }
                    this.messageBus.emit( "sync", params );
                    this.synctick = 0;
                }
            }

        } 
             


        this.update_animate_button();
        

        this.globaltick += 1;

        
        // Emit here, not in onData of messageBus
        if ( this.emitBus.length > 0 ) {

            let msg = this.emitBus.shift();
            let params  = {
                userID      : this.userID,
            }
            if ( msg.length >= 2 ) {
                params["recipient"] = msg[1];
            }
            if ( msg.length >= 3 ) {
                params["data"] = msg[2];
            }
            this.messageBus.emit( msg[0], params );
        }

    }



    //-----------
    update_mana() {

        this.uitxt_mana.value = "Mana : " + this.current_mana ;
    
    }


    //-----------
    update_score() {

        if ( this.life_remaining >= 10 ) {
            this.uitxt_life.positionX = -58;    
        } else {
            this.uitxt_life.positionX = -54;
        }
        this.uitxt_life.value = this.life_remaining;

    }

    update_time() {

        if ( this.game_state == 1 ) {
            
            this.tick += 1 ;
            
            if ( this.tick > 30 ) {
                this.tick = 0 ;


                if ( this.time_remaining > 0 ) {
                    this.time_remaining -= 1;
                } else {

                    
                    this.release_monster_count = 0;
                    this.release_monster_tick = 150;
                    
                    this.current_wave += 1;
                    this.time_remaining = this.monster_cycle_wait_time;

                    if ( this.current_wave > 100 ) {
                        this.endgame();
                    }

                }
            }

            let minutes_rem = (this.time_remaining / 60 ) >> 0;
            let seconds_rem = this.time_remaining % 60;

            let zeropad = ""
            if ( (seconds_rem).toString().length == 1 ) {
                zeropad = "0";
            }
            this.uitxt_time.value = "Wave " + (this.current_wave + 1) + " to be released in :" +  minutes_rem + ":" + zeropad +  seconds_rem 
        
        
            
        }
    }




    //------------------------------------
    // Bookmark update_button_ui

    update_button_ui( ) {

        let b;
        for ( b in this.buttons ) {
            this.buttons[b].hide();
        }
        for ( b in this.menu_labels ) {
            this.menu_labels[b].getComponent( TextShape ).value = "";
        }
        this.card_sel_parent.getComponent(Transform).position.y  = -999;
        this.uiimg_selected_unit_photo.getComponent( PlaneShape ).visible = false;
                    
        
        if ( this.game_state == 0 ) { 

            this.uiimg_redflag.visible = false;
            this.uiimg_blueflag.visible = false;
            this.uiimg_selected_card.visible = false;
            this.current_selected_unit_highlight.getComponent( PlaneShape).visible = false;
            this.current_selected_unit_highlight.getComponent( Transform ).position.y = -999;
                        

            if  ( this.menu_page == 0 ) {
            
                this.buttons["singleplayer"].show();
                //this.buttons["multiplayer"].show();

                this.displayHighscores();
            
            } else if ( this.menu_page == 1  ) {

                this.card_sel_parent.getComponent(Transform).position.y = -2;
                this.menu_labels["lbl1"].getComponent(TextShape).value = "Please Select "+ this.need_select_n_card +" cards to use"
                this.buttons["confirm"].show();
                this.buttons["cancel"].show();
                
            }  else if ( this.menu_page == 2 ) {

                // For battle starting.
            }  else if ( this.menu_page == 3 ) {

                this.menu_labels["lbl1"].getComponent(TextShape).value = "Host or Join Game."
                
                this.buttons["cancel"].show();
                this.buttons["hostgame"].show();
                
                // Multiplayer page 
                this.refresh_available_games_ifneeded();





            } else if ( this.menu_page == 4 ) {

                this.menu_labels["lbl1"].getComponent(TextShape).value = "Waiting for others to join....."
                this.buttons["cancel"].show();

            } else if ( this.menu_page == 5 ) {

                this.menu_labels["lbl1"].getComponent(TextShape).value = "Joining the host..."
                this.buttons["cancel"].show();
    
            }

        } else if ( this.game_state == 1 ) {

            this.uiimg_redflag.visible = false;
            this.uiimg_blueflag.visible = false;
            
            
            if ( this.menu_page == 0 ) {
            
                this.card_sel_parent.getComponent(Transform).position.y = 2;
                this.buttons["leavegame"].show();

                this.menu_labels["lbl1"].getComponent( Transform ).scale.setAll( 0.25 )
                this.menu_labels["lbl1"].getComponent( TextShape ).color = Color3.White();
                this.menu_labels["lbl1"].getComponent(TextShape).value = "Select a card to deploy."

            
            } else if ( this.menu_page == 12 ) {


                this.menu_labels["lbl1"].getComponent( Transform ).scale.setAll( 0.25 )
                this.menu_labels["lbl1"].getComponent( TextShape ).color = Color3.White();

                this.menu_labels["lbl1"].getComponent(TextShape).value = "Unit Selected. Upgrade or Sell."

                if ( this.current_selected_unit != null ) {

                    let u = this.current_selected_unit;    
                    
                    let txcard      = this.get_txcard_by_type( u.type );
                    if ( txcard != null ) {

                        let upgrade     = u.damage;
                        let upgradecost = Math.pow( 2 , u.curlvl - 1 ) * txcard.manaCost ;
                        let sellcost    = upgradecost / 2  ;
                        
                        this.uiimg_selected_unit_photo.getComponent( Material ).albedoTexture = resources.textures[ txcard.texturename ];


                        this.menu_labels["lbl4"].getComponent( TextShape ).value = ""+  this.getTowerUnitName( txcard.type ) +"\nLevel: "+ u.curlvl + "\nDamage: "+ u.damage +"\nUpgrade: +"+ upgrade +"\nUpgradeCost: "+ upgradecost +"\nSell: "+ sellcost + "\nHP: "+ u.curhp + "" ;
                    
                    } else {    
                        this.menu_labels["lbl4"].getComponent( TextShape ).value = "";
                    }
                }

                this.uiimg_selected_unit_photo.getComponent( PlaneShape ).visible = true;

        
                this.buttons["cancel"].show();
                this.buttons["upgrade"].show();
                this.buttons["sell"].show();
                   
            }


        } else if ( this.game_state == 2 ) {


            this.buttons["leavegame"].show();
        }
    }


    //-------
    get_txcard_by_type( type ) {
        let i;
        for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {
            let txcard = this.player_cards_collection[i];
            if ( txcard.type == type ) {
                return txcard;
            }
        }    
        return null;
    }



    //----------------------
    displayHighscores() {

        let url = "https://tensaistudio.xyz/manadefense/get_highscore.tcl";
        let fetchopt = {
            headers: {
              'content-type': 'application/json'
            },
            method: 'GET'
        };

        executeTask(async () => {
            try {
                let resp = await fetch(url, fetchopt ).then(response => response.json())
            
                log("sent request to URL", url , "SUCCESS", resp );
                let str = "";
                let i;
                for ( i = 0 ; i < resp.length ; i++ ) {
                    str += ( i + 1 ) + "." + " " + resp[i]["username"] + "     " + resp[i]["score"] + "\n";
                }
                this.menu_labels["lbl5"].getComponent(TextShape).value = "Highscores"
                this.menu_labels["lbl6"].getComponent(TextShape).value = str;
            } catch(err) {
                log("error to do", url, fetchopt, err );
            }
        });
    }


    //----------------------
    async submitHighscores() {

        let url = "https://tensaistudio.xyz/manadefense/update_highscore.tcl";
       
        const myaddress = await getUserAccount()
        log("myaddress is " , myaddress);

        let username = this.userID;
        let useraddr = myaddress;
        let score    = this.current_wave;

        let sig      = Utils.sha256(useraddr + "wibble" + score );

        let fetchopt = {
            headers: {
              'content-type': 'application/json'
            },
            body: "username="+ username + "&score="+ score + "&useraddr=" + useraddr+ "&sig=" + sig,
            method: 'POST'
        };
        let _this = this;
        try {
            let resp = await fetch(url, fetchopt ).then(response => response.text())
            log("sent request to URL", url , "SUCCESS", resp );
            _this.displayHighscores();

        } catch(err) {
            log("error to do", url, fetchopt, err );
        }
   
    }





    //------------------------------------
    refresh_available_games_ifneeded() {

        if ( this.game_state == 0 && this.menu_page == 3 ) {

            let i;
            for ( i = 0 ; i < 5 ; i++ ) {
                 this.buttons["playButton" + i ].hide();
            }
            let hostid ;
            i = 0;
            for ( hostid in this.available_gamehosts ) {

                if ( i >= 5 ) {
                    break;
                }

                this.buttons["playButton" + i ].show();
                this.buttons["playButton" + i ].text_shape.value = hostid;
                this.buttons["playButton" + i ].userData = hostid;
                i += 1;
                
            }
        }
    }






















    //---------------------------
    //
    //         INPUTS
    //
    //---------------------------
    // 


    global_input_down(e) {

        if ( e.buttonId == 0 ) {

            if ( this.game_state == 1 ) {
            	if ( e.hit ) {

    				let hitEntity = engine.entities[e.hit.entityId];
    				
    				if (  hitEntity == this.battleground ) {
    					
                        
    					let mouse_z = -( e.hit.hitPoint.x - this.transform.position.x );
    					let mouse_x =  ( e.hit.hitPoint.z - this.transform.position.z );


                        let tile_x = Math.round( ( mouse_x  ) / this.grid_size_x ) >> 0 ;
                        let tile_z = Math.round( ( mouse_z  ) / this.grid_size_z ) >> 0 ;

                        let place_x = tile_x * this.grid_size_x;
                        let place_z = tile_z * this.grid_size_z;

                        //log( "mouse", mouse_x , mouse_z );



                        if ( this.txcard_selected != null ) {
    						
                            if ( this.current_mana >= this.txcard_selected.manaCost  ) {
                                
                                let placement_allowed_ret = this.placement_is_allowed( tile_x , tile_z ) ;

                                if ( this.txcard_selected.isSpell == 1 || placement_allowed_ret == 1  ) {


                                    this.current_mana -= this.txcard_selected.manaCost;
                                    this.queue_command( [ "spawnUnit", this.txcard_selected.type , place_x , place_z , this.playerindex ] );

                                    
                                     this.uitxt_instruction.value = "";

                                } else {
                                    if ( placement_allowed_ret == -1 ) {
                                        this.uitxt_instruction.value = "Cannot build here. Something is walking on it."

                                    } else if ( placement_allowed_ret == -2 ) {
                                        this.uitxt_instruction.value = "Cannot build here. This will block the path."
                                        
                                    } else if ( placement_allowed_ret == -3 ) {

                                        this.uitxt_instruction.value = "Tile Already placed."

                                    } else {
                                        this.uitxt_instruction.value = "Not allowed to place there."
                                    
                                    }
                                    this.sounds["denied"].playOnce();

                                }
                            } else {
                                this.uitxt_instruction.value = "Not enough mana";
                                this.sounds["denied"].playOnce();

                            }
    								
    					} else {
                            this.uitxt_instruction.value = "No card selected.";
                            this.sounds["denied"].playOnce();

                        }
                        

    				}
    			}
            }

        } else if ( e.buttonId == 1  ) {
        	

            // E button
        	if ( this.debugsetting == 1 ) {
            }
            //this.submitHighscores()
            

        } else if ( e.buttonId == 2 ) {
        	// F button 	
        	
            if ( this.debugsetting == 1 ) {
            
            }
        }	
     }



     //----------------------
    global_input_up(e) {

        if ( e.buttonId == 0 ) {
      	
        } else if ( e.buttonId == 1 ) {
            

        } else if ( e.buttonId == 2 ) {


        }
     }



    //------------------
    txclickable_button_onclick( id , userData ) {
        

        if ( id == "confirm" && this.game_state == 0 && this.menu_page == 1 ) {

            if ( this.count_card_selected() == this.need_select_n_card ) {
                

                if ( this.game_mode == 1 ) {
                
                    // Single player. Can start straight away..
                    this.animate_button_tick = 20;
                    this.animate_button_callback_id = id;
                    this.sounds["buttonclick"].playOnce();
                

                } else if ( this.game_mode == 2 ) {

                    // Multiplayer requires both player to click confirm.

                    let params  = {
                        userID      : this.userID,
                        recipient   : this.opponent
                    }
                    this.messageBus.emit( "iamready", params );
                    this.isReady = 1;
                    this.check_both_ready("confirm");
                }

            } else {
                this.menu_labels["lbl1"].getComponent( TextShape ).value = "Please select exactly " + this.need_select_n_card + " cards";
                this.sounds["denied"].playOnce();

            }



        } else if ( id == "upgrade" && this.current_selected_unit != null ) {
                
            let txcard      = this.get_txcard_by_type( this.current_selected_unit.type );
            if ( txcard != null ) { 
             
                let upgradecost = Math.pow( 2 , this.current_selected_unit.curlvl - 1 ) * txcard.manaCost ;
                
                if ( this.current_mana >= upgradecost ) {

                    if ( this.current_selected_unit.curlvl < 8 ) {
                        
                        this.current_selected_unit.curlvl += 1;
                        this.current_selected_unit.update_levelbadge_uv();
                        this.current_mana -= upgradecost;


                        let upgrade_damage_delta = this.current_selected_unit.damage;
                        this.current_selected_unit.damage += upgrade_damage_delta;
                        
                        let upgrade_hp_delta = ( this.current_selected_unit.maxhp * 0.5 ) >>0;
                        this.current_selected_unit.maxhp  += upgrade_hp_delta;
                        this.current_selected_unit.curhp  += upgrade_hp_delta;

                        
                        this.sounds["powerup"].playOnce();

                        this.animate_button_tick = 20;
                        this.animate_button_callback_id = id;
                        this.animate_button_userdata = userData;


                    } else {
                        
                        this.uitxt_instruction.value = "Max level reached";
                        this.sounds["denied"].playOnce();
                    }


                } else {
                    this.uitxt_instruction.value = "Not enough mana";
                    this.sounds["denied"].playOnce();
                }
            }
        

        } else if ( id == "sell" && this.current_selected_unit != null ) {    
            
            let txcard      = this.get_txcard_by_type( this.current_selected_unit.type );
            if ( txcard != null ) { 
                
                let upgradecost = Math.pow( 2 , this.current_selected_unit.curlvl - 1 ) * txcard.manaCost ;
                let sellcost    = upgradecost / 2;

                this.current_selected_unit.curlvl = 1;
                this.current_selected_unit.die();
                this.current_mana += sellcost;

            }
        } else {


            this.animate_button_tick = 20;
            this.animate_button_callback_id = id;
            this.animate_button_userdata = userData;
            this.sounds["buttonclick"].playOnce();

        }

   }


    //----------
    check_both_ready( id ) {

        if ( this.isReady == 1 && this.isOpponentReady == 1 ) {
            this.animate_button_tick = 20;
            this.animate_button_callback_id = id;
            this.sounds["buttonclick"].playOnce();
            this.globaltick = 0;


        } else {
            if ( this.isReady == 1 ) {
                this.menu_labels["lbl3"].getComponent( TextShape ).value = "Waiting for " +  this.opponent + " to get Ready ...";
            } else {
                this.menu_labels["lbl3"].getComponent( TextShape ).value = this.opponent + " is Ready";
            }
        }
    }


   //-------------------------
   update_animate_button() {
        
        if ( this.animate_button_callback_id != "" ) {
            

            if ( this.animate_button_tick > 0 ) {

                if ( this.animate_button_callback_id == "battlebegin" ) {
                        
                    let animate_delta = 40 - this.animate_button_tick;
                    this.uiimg_redflag.positionX   = -100 + animate_delta * 40;
                    this.uiimg_blueflag.positionX  =  100 - animate_delta * 40;
                    this.uitxt_instruction.fontSize = 80 - animate_delta  * 2 ;
                    this.ui3d_root.getComponent( Transform ).position.y = -999;      
                } else {
                    this.ui3d_root.getComponent( Transform ).position.y -= 0.75;
                }

                this.animate_button_tick -= 1;
                 
            } else {

                if ( this.animate_button_callback_id == "battlebegin" ) {
                    
                    this.uiimg_redflag.visible = false;
                    this.uiimg_blueflag.visible = false;
                    this.uiimg_redflag.positionX   = -100;
                    this.uiimg_blueflag.positionX  =  100;
                    this.uitxt_instruction.fontSize = 16;
                    this.uitxt_instruction.value = "";

                } 
                
                this.ui3d_root.getComponent( Transform ).position.y = 5.5;
                
                let use_id = this.animate_button_callback_id;
                let userData = this.animate_button_userdata;

                this.animate_button_callback_id  = "";
                this.animate_button_userdata = "";
                this.txclickable_button_onclick_animate_done_continue( use_id , userData );

            }
        }
   }



   //--------------
   // Bookmark button_onclick
   txclickable_button_onclick_animate_done_continue( id , userData ) {

        if ( id == "singleplayer" ) {

            /*
            this.menu_page = 1;
            this.game_mode = 1;
            this.opponent = "A.I Bot";

            this.rearrange_cards_collection();
            this.update_button_ui();
            
                // No need to select card, use all cards
            */
            
                    
            this.game_mode = 1;
            this.menu_page = 2;
            this.update_button_ui();
            this.sounds["warhorn"].playOnce();
            this.animate_button_callback_id = "battlebegin";
            this.animate_button_tick = 40;
            this.uiimg_redflag.visible = true;
            this.uiimg_blueflag.visible = true;
            this.uitxt_instruction.value = "Start";


        } else if ( id == "multiplayer" ) {

            this.menu_page = 3;
            this.game_mode = 2;
            this.opponent = "";
            

            this.update_button_ui();

            let params  = {
                userID      : this.userID
            }
            this.messageBus.emit( "whohost", params );


        } else if ( id == "hostgame" ) {

            this.menu_page = 4;
            this.game_mode = 2;
            this.opponent = "";
            this.isOpponentReady = 0;
            this.isReady = 0;

            this.update_button_ui();

            this.isHost   = 1;
            this.isClient = 0;

            let params  = {
                userID      : this.userID,
            }
            this.messageBus.emit( "iamhost", params );
            


        } else if ( id == "play" ) {

            this.menu_page = 5;
            this.game_mode = 2;
            this.opponent = "";
            this.isOpponentReady = 0;
            this.isReady = 0;

            this.update_button_ui();

            if ( userData != "" ) {
                let params  = {
                    userID      : this.userID,
                    recipient   : userData
                }
                this.messageBus.emit( "join", params );
            }



        } else if ( id == "cancel" ) {

            if ( this.menu_page == 4 ) {
                // I host then click cancel.
                this.menu_page = 3;
                let params  = {
                    userID      : this.userID,
                }
                this.messageBus.emit( "gametaken", params );

            
            } else if ( this.menu_page == 1 && this.game_mode == 2 ) {
            
                let params  = {
                    userID      : this.userID,
                    recipient   : this.opponent
                }
                this.messageBus.emit( "leave", params );
                this.isHost = 0;
                this.isClient = 0;
                this.opponent = "";
                this.game_mode = 0;
                this.menu_page = 0;

            } else {
                this.menu_page = 0;
            }
            this.update_button_ui();


        } else if ( id == "confirm" ) {

            if ( this.game_state == 0 && this.menu_page == 1 ) {
                
               
                this.menu_page = 2;
                this.update_button_ui();


                this.sounds["warhorn"].playOnce();

                this.animate_button_callback_id = "battlebegin";
                this.animate_button_tick = 40;

                this.uiimg_redflag.visible = true;
                this.uiimg_blueflag.visible = true;
                this.uitxt_instruction.value = "Start";
                

            }

        } else if ( id == "battlebegin" ) {

            this.select_all_cards();
            this.fill_player_cards_selected();
            this.rearrange_cards_selected(); 
            
            this.game_state = 1;
            this.menu_page  = 0;
            
            
            this.sounds["medieval"].stop();
            this.sounds["wardrum"].playOnce();
            this.current_mana = 80;

            this.update_button_ui();

            
                    

        } else if ( id == "leavegame" ) {

            this.game_state = 0;
            this.menu_page = 0;
            this.uitxt_instruction.value = "";

            this.menu_labels["lbl1"].getComponent( Transform ).scale.setAll( 0.25 )
            this.menu_labels["lbl2"].getComponent( Transform ).scale.setAll( 0.25 )
            this.menu_labels["lbl3"].getComponent( Transform ).scale.setAll( 0.25 )
            
            this.menu_labels["lbl1"].getComponent( TextShape ).color = Color3.White();
            this.menu_labels["lbl3"].getComponent( TextShape ).color = Color3.White();

            this.menu_labels["lbl2"].getComponent( Transform ).position.y = 3.9;
            this.menu_labels["lbl3"].getComponent( Transform ).position.y = 3.55;
            
            this.sounds["wardrum"].stop();
            this.sounds["medieval"].playOnce();
            
            if ( this.game_mode == 2 ) {

                 let params  = {
                    userID      : this.userID,
                    recipient   : this.opponent
                }
                this.messageBus.emit( "leave", params );
            }


            this.isHost = 0;
            this.isClient = 0;
            this.opponent = "";
            this.game_mode = 0;
                 

            this.reset_game();
            this.update_button_ui();
            
        } else if ( id == "unitclick" ) {

            this.menu_page = 12;
            this.update_button_ui();
        

        } else if ( id == "upgrade" ) {
            
            this.update_button_ui();

        }
   }



    //---------------------------
    card_input_down( e, txcard ) {

        this.sounds["buttonclick"].playOnce();
        
        if ( this.game_state == 0 ) {

            if ( this.count_card_selected() >= this.need_select_n_card && txcard.isSelected == 0 ) {
                this.menu_labels["lbl1"].getComponent( TextShape ).value = "Maximum " + this.need_select_n_card + " cards. Click on the selected card to unselect " ;
            } else {
                txcard.toggle();
            }


            this.menu_labels["lbl2"].getComponent( TextShape ).value = "Cards Selected: " + this.count_card_selected() ;
            

        } else if ( this.game_state == 1 ) {
    	      
            let i;
            for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {
                let txcard = this.player_cards_collection[i];
                if ( typeof txcard != "undefined" ) {
                    txcard.turnoff();
                }
            }

            txcard.turnon(); 
            this.txcard_selected = txcard ;

            this.uiimg_selected_card.source = txcard.getComponent(Material).albedoTexture;
            this.uiimg_selected_card.visible = true;
            this.uitxt_selected_card_mana.value = txcard.manaCost;

            this.uitxt_instruction.value = "";
            
        }   

    }



    //---------------------------
    card_input_up( e, type ) {
    
    }



    //---------
    unit_input_down( e, unit ) {

        if ( this.game_state == 1 ) {

            this.animate_button_tick = 20;
            this.animate_button_callback_id = "unitclick";
            this.sounds["buttonclick"].playOnce();

            this.current_selected_unit_highlight.getComponent( PlaneShape).visible = true;
            this.current_selected_unit_highlight.getComponent( Transform ).position.y = 1.5;
            this.current_selected_unit_highlight.getComponent(Transform).position.x = unit.transform.position.x;
            this.current_selected_unit_highlight.getComponent(Transform).position.z = unit.transform.position.z;

            this.current_selected_unit = unit;

        }
    }





































    //---------------
    //         MessageBus
    //--------------

    init_MessageBus() {

        let _this = this;
        this.messageBus = new MessageBus();
        this.messageBus.on("join", (info: EmitArg) => {
            if ( this.userID != info.userID && this.userID == info.recipient ) {
                
                log("bus: join", info);
                        
                // Somebody join me    
                // Reason for using emitBus is because we dont want to use messageBus to send in onData handler. 
                // We let the update() to send instead.
                if ( _this.opponent == "" ) { 
                    _this.emitBus.push( [ "join_resp" , info.userID ] );
                    _this.emitBus.push( [ "gametaken" ] );


                    _this.opponent = info.userID;
                    _this.game_mode = 2;
                    _this.menu_page = 1;
                    _this.playerindex = 1;

                
                    _this.rearrange_cards_collection();
                    _this.update_button_ui();

                } else {
                    _this.emitBus.push( [ "join_reject" , info.userID ] );
                }

                
            }
        });
        this.messageBus.on("join_resp", (info: EmitArg) => {

            // Host resp my join
            if ( this.userID != info.userID  && this.userID == info.recipient ) {
                log("bus: join_resp", info );
                
                _this.opponent = info.userID;
                _this.isClient = 1;
                
                _this.game_mode = 2;
                _this.menu_page = 1;
                _this.playerindex = -1;
               
                _this.rearrange_cards_collection();
                _this.update_button_ui();

            }
        });

        this.messageBus.on("join_reject", (info: EmitArg) => {

            // Host resp my join
            if ( this.userID != info.userID  && this.userID == info.recipient ) {
                
                log("bus: join_reject", info );
                _this.menu_page = 3;
                _this.update_button_ui();

            }
        });

        this.messageBus.on("iamhost", (info: EmitArg) => {
            log("buso iamhost", info );
            if ( this.userID != info.userID ) {
                
                log("bus: iamhost", info );
                _this.available_gamehosts[ info.userID ] = 1;
                _this.refresh_available_games_ifneeded();
                
            }
        });

        this.messageBus.on("whohost", (info: EmitArg) => {
            if ( this.userID != info.userID ) {
                log("bus: whohost", info );
                
                if ( _this.isHost == 1 && _this.opponent == "" ) {
                    _this.emitBus.push( [ "iamhost" , info.userID ] );
                }
                
            }
        });

        

        this.messageBus.on("gametaken", (info: EmitArg) => {
            if ( this.userID != info.userID ) {
                log("bus: gametaken", info );
                
                delete  _this.available_gamehosts[ info.userID ] ;
                _this.refresh_available_games_ifneeded();
                
            }
        });

        this.messageBus.on("leave", (info: EmitArg) => {
            if ( this.userID != info.userID    && this.userID == info.recipient  ) {
                
                log("bus: leave", info );
                

                if ( this.game_state == 0 ) {
                    
                    // Opponent left at menu stage, i m still host can take other opponent
                    
                    if ( _this.isHost == 1 ) {
                        _this.menu_page = 4;
                        _this.update_button_ui();
                        _this.emitBus.push( [ "iamhost" ] );
                        _this.menu_labels["lbl1"].getComponent( TextShape ).value = info.userID + " left. Waiting for another challenger...." ;
                    
                    } else { 
                        _this.menu_page = 3;
                        _this.update_button_ui();
                         _this.menu_labels["lbl1"].getComponent( TextShape ).value = info.userID + " has left. Host or Join Game." ;
                    
                    } 

                } else if ( _this.game_state == 1 ) {

                    if ( _this.opponent == info.userID ) {
                        if ( _this.playerindex == 1 ) {

                        } else {
                         
                        }
                        _this.endgame();
                        _this.uitxt_instruction.value = "Opponent has cowardly left the game. You won ";
                    }
                }
                _this.opponent = "";
                _this.isOpponentReady = 0;
                
            }
        });


        this.messageBus.on("iamready", (info: EmitArg) => {

            if ( this.userID != info.userID    && this.userID == info.recipient  ) {
                    
                log("bus: iamready", info );
                _this.isOpponentReady = 1;
                _this.check_both_ready("confirm");

            }
        });

        this.messageBus.on("gamecmd", (info: EmitArg) => {

            if ( this.userID == info.userID  || this.opponent == info.userID  ) {
                log("bus: gamecmd", info );

                let emit_data  = info.data;
                if ( emit_data[0] == "spawnUnit" ) {

                    let spawn_absolute_tick = emit_data[5];
                    let wait_buffer         = spawn_absolute_tick - _this.globaltick;


                    if ( wait_buffer < 0 ) {
                        // Missed out the spawn absolute tick..We are way too late
                        wait_buffer = 0;
                    }
                    if ( wait_buffer > 40 ) {
                        // We are way too ahead..
                        wait_buffer = 40;
                    }

                    log("recv spawn cmd:", emit_data[1], "now ",this.globaltick , "tospawn_at", spawn_absolute_tick  );

                    _this.spawnUnit( 
                        emit_data[1],
                        emit_data[2],
                        emit_data[3],
                        emit_data[4],
                        wait_buffer
                    );
                }    
            }
        });

        this.messageBus.on("sync", (info: EmitArg) => {

            if ( this.userID != info.userID    && this.userID == info.recipient  ) {
                log("bus: sync", info );

                let oppo_globaltick     = info.data[0];
                let oppo_time_remaining  = info.data[1];
                if ( _this.globaltick < oppo_globaltick ) {
                    
                    log( "Syncing my globaltick to opponent's globaltick", _this.globaltick , oppo_globaltick );
                    _this.globaltick = oppo_globaltick;

                }
                if ( _this.time_remaining > oppo_time_remaining ) {
                    log("Syncing my time_remaining to opponent's time rem", _this.time_remaining, oppo_time_remaining);
                    _this.time_remaining = oppo_time_remaining;
                }
                    
            }
        });

    }















    //-----------
    queue_command( cmd_arr ) {

        if ( cmd_arr[0] == "spawnUnit" ) {

            let spawn_absolute_tick = this.globaltick + 15;
            cmd_arr[5] = spawn_absolute_tick ;          

            //log( "spawn_absolute_tick ", cmd_arr[1] , spawn_absolute_tick );
            
            let params  = {
                userID      : this.userID,
                data        : cmd_arr
            }
            this.messageBus.emit( "gamecmd", params ); 
        }
    }

    




    //-------------------
    //
    //      Navigation
    //
    //-----------------------




    //--------------
    reset_game() {
        
        this.time_remaining = this.monster_cycle_wait_time;
        this.life_remaining = 20;    
        this.current_mana   = 80;
        this.current_wave   =  0;
        this.release_monster_count = 0;


        // Clear everything.
        let u;
        for ( u = this.units.length - 1 ; u >= 0 ;  u--) {
            let unit = this.units[u];
            if ( unit != null ) {
                this.removeUnit( unit ); 
            }
        }

        let p;
        for ( p = this.projectiles.length - 1 ; p >= 0 ; p-- ) {
            let projectile = this.projectiles[p];
            if ( projectile != null  ) {
                this.removeProjectile( projectile );
            }
        }

        let exp;
        for ( exp = this.explosions.length - 1 ; exp >= 0 ; exp-- ) {
            let explosion = this.explosions[exp];
            if ( explosion != null  ) {
               this.removeExplosion( explosion );
            }
        }
        
        let cl;
        for ( cl = this.clocks.length - 1 ; cl >= 0 ; cl-- ) {
            let clock = this.clocks[cl];
            if ( clock != null  ) {
                this.removeClock( clock );
            }
        }

            
        this.update_score();
        this.reset_pathfinder_obstacles();

    }



    //-------------
    // Bookmark endgame
    endgame( ) {
    
        this.sounds["endgame"].playOnce();

        this.game_state = 2;
        let final_txt = "Game Over.\n";

        if ( this.life_remaining > 0 && this.current_wave > 100 ) {
            
            final_txt = "Congratulations! Defender(Red) Wins!";
            this.uiimg_redflag.visible = true;


        } else if ( this.life_remaining <= 0 ) {
            final_txt += "Attacker(Blue) Wins!";
            this.uiimg_blueflag.visible = true;
            
        } 

        this.submitHighscores();


        final_txt += "\n\nLeave game to restart again";
        this.uitxt_instruction.value = final_txt;
        this.uitxt_time.value = "";

        this.update_score();
        this.update_button_ui();
    }









    //---------
    get_txcard_selected_index() {
        let i;
        for ( i = 0 ; i < 4 ; i++ ) {
            if ( this.player_cards_in_use[i] == this.txcard_selected ) {
                return i;
            }
        }
        return -1;   
    }



    //----------------
    rotate_card_in_use() {

        let i;

        if ( this.txcard_selected != null ) {
            
            let card_selected_index = this.get_txcard_selected_index();
            this.player_cards_in_use[card_selected_index] = this.player_cards_in_use[this.cards_dealt_in_game];
            this.player_cards_in_use[this.cards_dealt_in_game] = this.player_cards_in_use[this.cards_dealt_in_game+1];
            this.player_cards_in_use[this.cards_dealt_in_game+1] = this.player_cards_in_use[this.cards_dealt_in_game+2];
            this.player_cards_in_use[this.cards_dealt_in_game+2] = this.player_cards_in_use[this.cards_dealt_in_game+3];
            this.player_cards_in_use[this.cards_dealt_in_game+3] = this.txcard_selected;
            this.txcard_selected.turnoff();
        }
        this.txcard_selected = null;
        this.uiimg_selected_card.visible = false;
                

        this.rearrange_cards_selected(); 
        
    }


    //---------------
    select_all_cards() {
        let i;
        for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {
            let txcard = this.player_cards_collection[i];
            txcard.turnon();
        }
    }

    //--------------------
    fill_player_cards_selected() {

        let i;
        this.player_cards_in_use.length = 0;
        for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {

            if ( this.player_cards_collection[i].isSelected ) {
                let txcard = this.player_cards_collection[i];
                this.player_cards_in_use.push( txcard );
            }
        }


    }


    //------------------
    rearrange_cards_collection() {

        let i;

        for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {
            
            let txcard = this.player_cards_collection[i];
            if ( typeof txcard != "undefined" ) {
                let x = ( i % 4 ) * 1.2 - 2;
                let y = ((i / 4)  >> 0 ) * 1.2;
            
                txcard.reposition( x,y );
                txcard.show();
                txcard.turnoff();
            }
        }

    }

    //------------------
    rearrange_cards_selected() {

        let i;

        for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {
            let txcard = this.player_cards_collection[i];
            txcard.hide();
        }
        

        for ( i = 0 ; i < this.cards_dealt_in_game && i < this.player_cards_collection.length ; i++ ) {
            
            let x =  ( i % 4 ) * 1.2 - 2;
            let y = ((i / 4)  >> 0 ) * 1.2 - 2;
            
            let txcard = this.player_cards_in_use[i];
            if ( typeof txcard != "undefined" ) {
                txcard.reposition( x,y );
                txcard.show();
                txcard.turnoff();
            }
            
        }
    }

    //-----
    count_card_selected() {

        let i;
        let count = 0;
        for ( i = 0 ; i < this.player_cards_collection.length ; i++ ) {
            if ( this.player_cards_collection[i].isSelected ) {
                count += 1;
            }
        }
        return count;
    }




    //-----------------------------------------------------
    placement_is_allowed(  tile_x , tile_z ) {

        // Check boundary
        if ( tile_x >= -6 && tile_x <= 6 && 
             tile_z >= -6 && tile_z <= 6 ) {
            // Can   
        } else {
            // Cannot
            return 0;
        }

        // Check tower on tile already or not.
        var node;
        node = this.pathfinder.getNode( tile_x , tile_z );
        if ( node != null && node["walkable"] == 0 ) {
            return -3;
        }   


        // Check mob on tile or not
        let i;
        for ( i = 0 ; i < this.units.length ; i++ ) {
            let u = this.units[i];
            if ( u != null && u.dead == 0 && u.owner == -1 && u.isFlying == 0 ) {
                let u_tile_x = Math.round( ( u.box2dbody.GetPosition().x  ) / this.grid_size_x ) >> 0 ;
                let u_tile_z = Math.round( ( u.box2dbody.GetPosition().y  ) / this.grid_size_z ) >> 0 ;
                if ( u_tile_x == tile_x && u_tile_z == tile_z ) {

                    // Mob stepping on it..
                    return -1;
                }
            }
        }


        // Check path
        node = this.pathfinder.createNode( tile_x, tile_z );
        node["walkable"] = 0;

        let findpath_ret    =  this.pathfinder.findPath( -7,0 ,7, 0) ;
        if ( findpath_ret == -1 ) {
            // No solution 
            log( "Main route cannot");
            node["walkable"] = 1;
            return -2;
        }
        return 1;
    }




   



    //-----------
    unit_on_die( unit ) {
        
        if ( this.game_state == 1 ) {

            if ( unit.owner == -1 ) {
            
                if ( unit.type == "giant" ) {
                    this.current_mana += 40;


                } else if ( unit.type == "prince" ) {
                    this.current_mana += 50;

                } else if ( unit.type == "pekka" ) {
                
                    this.current_mana += 60;    

                } else if ( unit.type == "gargoyle" ) {
                
                    this.current_mana += 40;    
                
                } else if ( unit.type == "hogrider") {
                    this.current_mana += 20;



                } else if ( unit.type == "knight" ) {
                    this.current_mana += 4;

                } else if ( unit.type == "archer" ) {

                    this.current_mana += 3;


              

                } else {
                    this.current_mana += 2;
                }
            }
            
            if ( this.current_selected_unit == unit ) {
                // If currently selected unit dies...
                this.animate_button_tick = 20;
                this.animate_button_callback_id = "cancel";
                this.current_selected_unit = null;
                this.current_selected_unit_highlight.getComponent( PlaneShape).visible = false;
                this.current_selected_unit_highlight.getComponent( Transform ).position.y = -999;
            }

            if ( unit.owner == 1 ) {
                
                let u_tile_x = Math.round( ( unit.transform.position.x  ) / this.grid_size_x ) >> 0 ;
                let u_tile_z = Math.round( ( unit.transform.position.z  ) / this.grid_size_z ) >> 0 ;

                let node = this.pathfinder.getNode( u_tile_x , u_tile_z );
                if ( node != null ) {
                    node["walkable"] = 1;
                    this.pathfinder.findPath( -7 , 0,  7 , 0 ) ;
                }
            }
        }   
    }



    //------------
    unit_on_finish( unit ) {
        
        if ( this.game_state == 1 ) {
            if ( unit.owner == -1 ) {


                this.life_remaining -= 1;
                this.update_score();

                if ( this.life_remaining <= 0 ) {
                    this.endgame();
                }
            }
        }
    }






    //-----------------------------
    get_monster_type_by_wave( ) {
        
        let monster_type = "skeleton";
        if ( this.current_wave  % 10 == 1 ) {
            monster_type = "skeleton";

        } else if ( this.current_wave % 10 == 2 ) {
            monster_type = "goblin";
        

        } else if ( this.current_wave % 10 == 3 ) {
            monster_type = "skeleton";
        

        } else if ( this.current_wave % 10 == 4 ) {
            monster_type = "goblin";
        
        
        } else if ( this.current_wave % 10 == 5 ) {
            monster_type = "hogrider";
        

        
        } else if ( this.current_wave % 10 == 6 ) {
            monster_type = "knight";
            
        
        } else if ( this.current_wave % 10 == 7 ) {
            monster_type = "archer";
        
        
        } else if ( this.current_wave % 10 == 8 ) {
            monster_type = "gargoylehorde";
        
        
        } else if ( this.current_wave % 10 == 9 ) {
            monster_type = "goblinspear";
        
        } else if ( this.current_wave % 10 == 0 && this.current_wave >= 10 ) {

            if ( this.current_wave % 50 == 10 ) { 
                monster_type = "giant";
            } else if ( this.current_wave % 50 == 20 ) {
                monster_type = "prince";
            } else if ( this.current_wave % 50 == 30 ) {
                monster_type = "pekka" ;
            } else if ( this.current_wave % 50 == 40 ) {
                monster_type = "gargoyle" ;
            } else if ( this.current_wave % 50 == 0  ) {
                monster_type = "pekka" ;
            }

        }



        return monster_type;
    }


    //-----------------------------
    get_monster_count_by_wave() {

        let monster_count = 40;
        
        // Boss
        if ( this.current_wave % 5 == 0 ) {
            monster_count = 2;
        }
        if ( this.current_wave % 10 == 0 ) {
            monster_count = 1;
        }

        if ( this.current_wave == 50 ) {
            monster_count = 5;
        }

        return monster_count;
    }


































    //---------------
    //
    // Init section
    //
    //---------------





    //-----------------------------------------------------------
    // Bookmark txcard
    public all_available_cards              = [ "towerarcher" , "towerwizard" , "spell_fireball","spell_zap", "towergoblinspear" , "towerknight"  , "emptyblock"  ];
    public all_available_cards_mana         = [             5,              20,               20,         15,                 15 ,            10  ,           2   ];
    public all_available_cards_isspell      = [             0 ,              0 ,               1 ,         1,                  0 ,             0  ,           0   ];
    public all_available_cards_modelname    = [     "archer"  ,       "wizard" ,              "" ,        "",      "goblinspear" ,    "knight"    ,          ""   ];
    public all_available_cards_texturename  = [     "archer" ,        "wizard" , "spell_fireball" , "spell_zap",   "goblinspear" ,    "knight"    , "emptyblock"  ];

     //----
    init_player_cards_collection() {

        this.player_cards_collection.length = 0;

        
        let i;
       
       
        let card_sel_parent = new Entity();
        card_sel_parent.addComponent( new Transform( {
            position: new Vector3( 0 , 0 ,  0 )
        }));
        card_sel_parent.setParent( this.ui3d_root );
       
        this.card_sel_parent = card_sel_parent;
        

        // So that can rotate 180 independantly of billboard
        let card_sel_3d_ui = new Entity();
        card_sel_3d_ui.setParent(card_sel_parent);
        
        let card_sel_3d_ui_transform = new Transform( {
            position: new Vector3( 0, 0, 0 ),
        });
        card_sel_3d_ui.addComponent( card_sel_3d_ui_transform );  
        card_sel_3d_ui_transform.rotation.eulerAngles = new Vector3( 0 , 180, 0 );


        
        // Card selected highlight 
        let card_sel_highlight_material = new Material();
        card_sel_highlight_material.emissiveColor = Color3.Green();
        card_sel_highlight_material.emissiveIntensity = 3;
        

        // Individual cards
        for ( i = 0 ; i < this.all_available_cards.length ; i++ ) {

            let x = (( i % 4 ) - 2 ) * 1.2;
            let y = ((i / 4)  >> 0 ) * 1.2;
            let z = 0;

            let card_type   = this.all_available_cards[i];
            let card_mana   = this.all_available_cards_mana[i];
            let modelname   = this.all_available_cards_modelname[i];
            let texturename = this.all_available_cards_texturename[i];

            let txcard = new Txcard(
                i ,
                card_sel_3d_ui,
                {
                    position: new Vector3( x, y, z),
                    scale   : new Vector3(1, 1, 1)
                },
                card_type,
                this,
                card_sel_highlight_material,
                card_mana,
                modelname,
                texturename
            );

            txcard.isSpell = this.all_available_cards_isspell[i] ;



            this.player_cards_collection.push( txcard );


             // Pre-load so that later can visible faster.
             
            let preview_model = new Entity();
            preview_model.setParent( this );
            preview_model.addComponent( new Transform(
                {
                    position: new Vector3( 0, -999 , 0 ),
                    scale   : new Vector3( 0.5,0.5,0.5)
                }
            ));
            if ( modelname != "" ) {
                preview_model.addComponent( resources.models[modelname] );
            }
            

        }

       
        

     }






    //----
    init_ui_3d() {

        
        this.ui3d_root = new Entity();
        this.ui3d_root.setParent( this );
        this.ui3d_root.addComponent( new Transform(
            {   
                position: new Vector3( -2 , 4.5 , 7.5 )
            }
        ) );

        // HEre doesn''t control , go to update_button_ui
        //this.ui3d_root.addComponent( new Billboard() );
        this.ui3d_root.getComponent( Transform ).rotation.eulerAngles = new Vector3(0 , 180 , 0 );


        let backboard = new Entity();
        backboard.setParent( this.ui3d_root );
        backboard.addComponent( new BoxShape() );
        backboard.addComponent( new Transform( 
            {
                position: new Vector3( 0 , 1 , -0.1  ),
                scale   : new Vector3( 7.4, 13,  0.1 ) 
            }
        ));
        let material = new Material();
        material.albedoColor = Color3.FromInts(102, 77, 51);
        backboard.addComponent( material );

        

        let backboard2 = new Entity();
        backboard2.setParent( this.ui3d_root );
        backboard2.addComponent( new BoxShape() );
        backboard2.addComponent( new Transform( 
            {
                position: new Vector3(-6.2 , 1 , -0.1  ),
                scale   : new Vector3( 5, 13,  0.1 ) 
            }
        ));
        let material2 = new Material();
        material2.albedoColor = Color3.FromInts(32, 18, 13);
        backboard2.addComponent( material2 );






        let logo = new Entity();


        logo.setParent( this.ui3d_root );
        logo.addComponent( new PlaneShape() );
        logo.addComponent( new Transform( 
            {
                position: new Vector3( 0 , 6, 0 ),
                scale   : new Vector3( 5,  5, 5 )
            }
        ));
        material = new Material();
        material.albedoTexture = resources.textures.logo;
        material.specularIntensity = 0;
        material.roughness = 1;
        material.transparencyMode = 2;
        logo.addComponent( material );
        logo.getComponent( PlaneShape ).uvs = [
            0, 0 ,
            1, 0 ,
            1, 1 ,
            0, 1 ,
            0, 0 ,
            1, 0 ,
            1, 1 ,
            0, 1 ,
        ];




        this.menu_labels["lbl1"] = new Entity();
        this.menu_labels["lbl1"].addComponent( new TextShape() );
        this.menu_labels["lbl1"].addComponent( new Transform(
            {
                position:new Vector3( 0,  4.25 , 0 ),
                scale   :new Vector3( 0.25, 0.25, 0.25 )
            }
        ));
        this.menu_labels["lbl1"].getComponent( TextShape ).color = Color3.White();
        this.menu_labels["lbl1"].getComponent( Transform ).rotation.eulerAngles = new Vector3(0,180,0);
        this.menu_labels["lbl1"].setParent( this.ui3d_root );


        this.menu_labels["lbl2"] = new Entity();
        this.menu_labels["lbl2"].addComponent( new TextShape() );
        this.menu_labels["lbl2"].addComponent( new Transform(
            {
                position:new Vector3( 0,  3.9 , 0 ),
                scale   :new Vector3( 0.25, 0.25, 0.25 )
            }
        ));
        this.menu_labels["lbl2"].getComponent( TextShape ).color = Color3.White();
        this.menu_labels["lbl2"].getComponent( Transform ).rotation.eulerAngles = new Vector3(0,180,0);
        this.menu_labels["lbl2"].setParent( this.ui3d_root );


        this.menu_labels["lbl3"] = new Entity();
        this.menu_labels["lbl3"].addComponent( new TextShape() );
        this.menu_labels["lbl3"].addComponent( new Transform(
            {
                position:new Vector3( 0,  3.55 , 0 ),
                scale   :new Vector3( 0.25, 0.25, 0.25 )
            }
        ));
        this.menu_labels["lbl3"].getComponent( TextShape ).color = Color3.White();
        this.menu_labels["lbl3"].getComponent( Transform ).rotation.eulerAngles = new Vector3(0,180,0);
        this.menu_labels["lbl3"].setParent( this.ui3d_root );








        let selected_unit_photo = new Entity();
        selected_unit_photo.setParent( this.ui3d_root );
        selected_unit_photo.addComponent( new PlaneShape() );
        selected_unit_photo.addComponent( new Transform(
            {
                position: new Vector3( 1.5, 2.5 ,0),
                scale : new Vector3(  2,  2 , 2 )
            }
        ));
        selected_unit_photo.getComponent( PlaneShape ).visible = false;
        selected_unit_photo.getComponent( PlaneShape ).uvs = [
            0, 0 ,
            1, 0 ,
            1, 1 ,
            0, 1 ,
            0, 0 ,
            1, 0 ,
            1, 1 ,
            0, 1 
        ];
        material = new Material();
        material.albedoTexture = resources.textures["archer"];
        material.specularIntensity = 0;
        material.roughness = 1;
        selected_unit_photo.addComponent( material );

        this.uiimg_selected_unit_photo = selected_unit_photo;
        





        this.menu_labels["lbl4"] = new Entity();
        this.menu_labels["lbl4"].addComponent( new TextShape() );
        this.menu_labels["lbl4"].addComponent( new Transform(
            {
                position:new Vector3( 1.5, 0.5 , 0 ),
                scale   :new Vector3( 0.25, 0.25, 0.25 )
            }
        ));

        this.menu_labels["lbl4"].getComponent( TextShape ).color = Color3.White();
        this.menu_labels["lbl4"].getComponent( Transform ).rotation.eulerAngles = new Vector3(0,180,0);
        this.menu_labels["lbl4"].setParent( this.ui3d_root );




        // Highscores
        this.menu_labels["lbl5"] = new Entity();
        this.menu_labels["lbl5"].addComponent( new TextShape() );
        this.menu_labels["lbl5"].addComponent( new Transform(
            {
                position:new Vector3( -6.2, 6.2 , 0 ),
                scale   :new Vector3( 0.45, 0.45, 0.45 )
            }
        ));

        this.menu_labels["lbl5"].getComponent( TextShape ).color = Color3.White();
        this.menu_labels["lbl5"].getComponent( Transform ).rotation.eulerAngles = new Vector3(0,180,0);
        this.menu_labels["lbl5"].setParent( this.ui3d_root );


        this.menu_labels["lbl6"] = new Entity();
        this.menu_labels["lbl6"].addComponent( new TextShape() );
        this.menu_labels["lbl6"].addComponent( new Transform(
            {
                position:new Vector3( -4.5, 5.0 , 0 ),
                scale   :new Vector3( 0.3, 0.3, 0.3 )
            }
        ));

        this.menu_labels["lbl6"].getComponent( TextShape ).color = Color3.White();
        this.menu_labels["lbl6"].getComponent( Transform ).rotation.eulerAngles = new Vector3(0,180,0);
        this.menu_labels["lbl6"].setParent( this.ui3d_root );
        this.menu_labels["lbl6"].getComponent( TextShape ).hTextAlign = "left";
        this.menu_labels["lbl6"].getComponent( TextShape ).vTextAlign = "top";
            
        

        this.init_buttons();
    }   






    //-----------------
    init_buttons() {

        this.buttons["singleplayer"] = new Txclickable_box(
            "Single Player" , 
            "singleplayer",
            {
                position: new Vector3( 0, 1.5,  0),
                scale   : new Vector3(0.5,0.5,0.5)
            },
            this.ui3d_root,
            this
        );


        
        this.buttons["multiplayer"] = new Txclickable_box(
            "Multi Player",
            "multiplayer", 
            {
                 position: new Vector3( 0, 0.5 ,  0),
                 scale   : new Vector3(0.5,0.5,0.5)
            },
            this.ui3d_root,
            this
        );


        

        this.buttons["confirm"] = new Txclickable_box(
            "Confirm" , 
            "confirm",
            {
                position: new Vector3( 1.5 , 3, 0),
                scale   : new Vector3(0.5,0.5,0.5)
            },
            this.ui3d_root,
            this
        );
        this.buttons["confirm"].hide();


        this.buttons["cancel"] = new Txclickable_box(
            "Cancel" , 
            "cancel",
            {
                position: new Vector3( -1.5 , 3,  0),
                scale   : new Vector3(0.5,0.5,0.5)
            },
           this.ui3d_root,
            this
        );
        this.buttons["cancel"].hide();




        this.buttons["leavegame"] = new Txclickable_box(
            "Leave Game" ,
            "leavegame", 
            {
                position: new Vector3( 0, -2, 0),
                scale   : new Vector3(0.5,0.5,0.5)
            },
            this.ui3d_root,
            this
        );
        this.buttons["leavegame"].hide();
        
            

        // host game 
         this.buttons["hostgame"] = new Txclickable_box(
            "Host Game" , 
            "hostgame",
            {
                position: new Vector3( 1.5 , 3, 0),
                scale   : new Vector3(0.5,0.5,0.5)
            },
            this.ui3d_root,
            this
        );
        this.buttons["hostgame"].hide();


        // This one is for joining game.
        let i;
        let itemcount = 5;
        for ( i = 0 ; i < itemcount;  i++ ) {

            this.buttons["playButton" + i ] = new Txclickable_box(
                "Play", 
                "play",
                {
                    position: new Vector3( 1.5 , 1.5 - i * 0.9  ,  0 ),
                    scale   : new Vector3(0.5,0.5, 0.5)
                },
                this.ui3d_root,
                this
            );

            this.buttons["playButton" + i ].hide();
            this.buttons["playButton" + i ].box_transform.scale.x = 4.2;
        }


        this.buttons["upgrade"] = new Txclickable_box(
            "Upgrade" , 
            "upgrade",
            {
                position: new Vector3( -1.5 , 1.5,  0),
                scale   : new Vector3(0.5,0.5,0.5)
            },
           this.ui3d_root,
            this
        );
        this.buttons["upgrade"].hide();


        this.buttons["sell"] = new Txclickable_box(
            "Sell" , 
            "sell",
            {
                position: new Vector3( -1.5 , 0.5,  0),
                scale   : new Vector3(0.5,0.5,0.5)
            },
           this.ui3d_root,
            this
        );
        this.buttons["sell"].hide();
    }   


    


    //--------------
    init_ui_2d() {


        let ui_2d_canvas = new UICanvas();
        //    ui_2d_canvas.height = 4000;

        let ui_2d_image = new UIImage(ui_2d_canvas, resources.textures.heart );
        ui_2d_image.vAlign = "bottom";

        ui_2d_image.width = 40;
        ui_2d_image.height = 40;
        ui_2d_image.sourceWidth = 128;
        ui_2d_image.sourceHeight = 128;
        ui_2d_image.positionX = -100;

        



        let ui_2d_text = new UIText( ui_2d_canvas );
        ui_2d_text.value = "0";
        ui_2d_text.vAlign = "bottom";
        ui_2d_text.fontSize = 14;
        ui_2d_text.positionX = -58;
        ui_2d_text.positionY =  12;
        this.uitxt_life = ui_2d_text;

        
        ui_2d_text = new UIText( ui_2d_canvas );
        ui_2d_text.value = "3:00";
        ui_2d_text.vAlign = "bottom";
        ui_2d_text.fontSize = 16;
        ui_2d_text.positionX = 30;
        ui_2d_text.positionY = 10;
        this.uitxt_time = ui_2d_text;
        

        ui_2d_text = new UIText( ui_2d_canvas );
        ui_2d_text.value = "" ;
        ui_2d_text.vAlign = "center";
        ui_2d_text.fontSize = 16;
        ui_2d_text.positionX = -50;
        ui_2d_text.positionY = 40;
        this.uitxt_instruction = ui_2d_text;



        ui_2d_text = new UIText( ui_2d_canvas );
        ui_2d_text.value = "";
        ui_2d_text.vAlign = "bottom";
        ui_2d_text.hAlign = "left";
        ui_2d_text.fontSize = 16;
        ui_2d_text.positionX = 0;
        ui_2d_text.positionY = 0;
        this.uitxt_mana = ui_2d_text;

        this.update_mana();
        






        // Selected card 2d ui

        ui_2d_image = new UIImage(ui_2d_canvas , resources.textures.giant );
        ui_2d_image.vAlign = "bottom";
        ui_2d_image.hAlign = "left";
        
        ui_2d_image.sourceWidth = 256;
        ui_2d_image.sourceHeight = 256;
        
        ui_2d_image.width = 64;
        ui_2d_image.height = 64;
        
        ui_2d_image.positionX = 0;
        ui_2d_image.positionY = 40;
        this.uiimg_selected_card = ui_2d_image;



        ui_2d_image = new UIImage( this.uiimg_selected_card , resources.textures.manaoutline );
        ui_2d_image.vAlign = "bottom";
        ui_2d_image.hAlign = "right";
            
        ui_2d_image.sourceWidth = 128;
        ui_2d_image.sourceHeight = 128;
        
        ui_2d_image.width = 32;
        ui_2d_image.height = 32;
        ui_2d_image.positionX = 10;
        ui_2d_image.positionY = -10;
        


        ui_2d_text = new UIText(  this.uiimg_selected_card );
        ui_2d_text.value = "20";
        ui_2d_text.vAlign = "bottom";
        ui_2d_text.hAlign = "right";
        ui_2d_text.fontSize = 12;
        ui_2d_text.positionX =  50;
        ui_2d_text.positionY =   -2;
        this.uitxt_selected_card_mana = ui_2d_text;

        this.uiimg_selected_card.visible = false;
        












        ui_2d_image = new UIImage(ui_2d_canvas , resources.textures.redflag );
        ui_2d_image.vAlign = "center";
        ui_2d_image.hAlign = "center";
        ui_2d_image.sourceWidth = 256;
        ui_2d_image.sourceHeight = 256;
        ui_2d_image.width = 256;
        ui_2d_image.height = 256;
        ui_2d_image.positionX = -100;
        ui_2d_image.positionY = 140;
        ui_2d_image.visible = false ;

        this.uiimg_redflag = ui_2d_image;

        ui_2d_image = new UIImage(ui_2d_canvas , resources.textures.blueflag );
        ui_2d_image.vAlign = "center";
        ui_2d_image.hAlign = "center";
        ui_2d_image.sourceWidth = 256;
        ui_2d_image.sourceHeight = 256;
        ui_2d_image.width = 256;
        ui_2d_image.height = 256;
        ui_2d_image.positionX = 100;
        ui_2d_image.positionY = 140;
        ui_2d_image.visible = false ;
        
        this.uiimg_blueflag = ui_2d_image;

    }




    //---
    init_shared_material() {

        let material = new Material();
        material.albedoTexture = resources.textures.explosion;
        material.roughness = 1.0;
        material.specularIntensity = 0;
        material.transparencyMode  = 2;
        material.emissiveIntensity = 4.5;
        material.emissiveColor = Color3.FromInts(252, 164, 23);
        this.shared_explosion_material = material;



        material = new Material();
        material.albedoTexture = resources.textures.zap;
        material.roughness = 1.0;
        material.specularIntensity = 0;
        material.transparencyMode  = 2;
        material.emissiveIntensity = 10.5;
        material.emissiveColor = Color3.FromInts(155, 155, 255);
        this.shared_zap_material = material;



        material = new Material();
        material.albedoTexture = resources.textures.fireball;
        material.roughness = 1.0;
        material.specularIntensity = 0;
        material.transparencyMode  = 2;
        material.emissiveIntensity = 4.5;
        material.emissiveColor = Color3.FromInts(252, 164, 23);
        this.shared_fireball_material = material;
        this.shared_fireball_shape = new PlaneShape();
        this.shared_fireball_shape.uvs = [
            0, 0 ,
            1/4, 0 ,
            1/4, 1/4 ,
            0, 1/4 ,
            0, 0 ,
            1/4, 0 ,
            1/4, 1/4 ,
            0, 1/4 ,
        ];






        material = new Material();
        material.albedoTexture = resources.textures.clock;
        material.roughness = 1.0;
        material.specularIntensity = 0;
        material.transparencyMode  = 2;
        this.shared_clock_material = material; 

        this.shared_box = new BoxShape();


        material = new Material();
        material.albedoTexture = resources.textures.levelbadge;
        material.roughness = 1.0;
        material.specularIntensity = 0;
        material.transparencyMode  = 2;
        this.shared_levelbadge_material = material; 

        this.shared_billboard = new Billboard();

    }




    init_sound( ) {

        let snd ;
        for ( snd in resources.sounds ) {
            this.sounds[snd]     = new Txsound(this, resources.sounds[snd] );
        }    

        this.sounds["wardrum"].playOnce();

    }







    //---------
    init_pathfinder()  {

        let grid        = {};
        let solution    = {};
        this.pathfinder = new PathFinder(grid , -7, -7, 7, 7, solution );
        this.reset_pathfinder_obstacles();
    }



    //-----------------
    reset_pathfinder_obstacles() {


        this.pathfinder.reset() ;

        let j;
        let node;

        for ( j = -7 ; j <= 7 ;j++ ) {
            
            node = this.pathfinder.createNode( j , -7 );
            node["walkable"] = 0;
            
            node = this.pathfinder.createNode( j ,  7 );
            node["walkable"] = 0;
            
            node = this.pathfinder.createNode( -7 , j );
            node["walkable"] = 0;
            
            node = this.pathfinder.createNode(  7 , j );
            node["walkable"] = 0;
        }
      

       
        for ( j = -1 ; j <= 1 ; j++ ) {
            node = this.pathfinder.getNode(-7,j );
            node["walkable"] = 1;
        
            node = this.pathfinder.getNode( 7,j );
            node["walkable"] = 1;
        
        }

        this.pathfinder.findPath( -7 , 0,  7 , 0 ) ;


      

    }



    getTowerUnitName( type ) {

        let remove_tower_prefix = type.replace("tower","")
        return remove_tower_prefix.charAt(0).toUpperCase() + remove_tower_prefix.slice(1);

    }




















    //--------------------------

    //        Game objects instantiation: Clock, Explosion, Projectiles, Unit

    //--------------------------



    //-------------
    removeClock( cl ) {

        engine.removeEntity( this.clocks[ cl.id ] );
        this.clocks[ cl.id ] = null ;

        

        let i;
        for ( i =  this.clocks.length - 1 ; i >= 0 ; i-- ) {
            // Shorten array if possible
            if ( this.clocks[i] == null ) {
                this.clocks.length = i;
            } else {
                break;
            }
        }

        //log( "clock removed ", cl.id  , this.clocks.length );

    }

    //------------
    getRecyclableClockIndex( ) {

        let i;
        for ( i = 0 ; i < this.clocks.length ; i++ ) {
            if ( this.clocks[i] == null ) {
                return i;
            }
        }
        return -1;
    }


    //------------
    getRecyclableClock( ) {

        return -1;
        let i;
        for ( i = 0 ; i < this.clocks.length ; i++ ) {
            if ( this.clocks[i] != null  && this.clocks[i].visible == 0 ) {
                return i;
            }
        }
        return -1;
    }

    //---------
    createClock( location_v3 , wait_buffer  ) {

        let clock:Txclock;
        let recyclable_index = this.getRecyclableClock( );


        if ( recyclable_index >= 0 ) {

            // Reuse entity
            clock                                   = this.clocks[recyclable_index];
            clock.getComponent(Transform).position  = location_v3;
            clock.tick                              = 0;
            clock.endtick                           = wait_buffer;
            
            clock.frame_index                       = 0;
            clock.frame_tick                        = 0;
            clock.frame_tick_per_frame              = ( wait_buffer / 16 ) >> 0;
            if ( clock.frame_tick_per_frame < 1 ) {
                clock.frame_tick_per_frame = 1;
            }

            clock.getComponent( PlaneShape ).uvs    = clock.getUV_coord();
            clock.visible                           = 1;
            
            //log( "clock reuse entity" , clock.id , " arr len", this.clocks.length );

        } else {
        
            clock = new Txclock(
                this.clocks.length,
                this,
                {
                    position: location_v3
                },
                this.shared_clock_material,
                wait_buffer
            ) ;
            
            recyclable_index = this.getRecyclableClockIndex();

            if ( recyclable_index == -1 ) {
                this.clocks.push( clock );

            } else {
                // Reuse index.
                clock.id = recyclable_index;
                this.clocks[recyclable_index] = clock;
            }

           // log( "Clock " , clock.id , " inited. arr len", this.clocks.length );
        }

       
            
        return clock;
    }







    //------------------
    removeExplosion( ex ) {

        engine.removeEntity( this.explosions[ ex.id ] );
        this.explosions[ ex.id ] = null;

        let i;
        for ( i =  this.explosions.length - 1 ; i >= 0 ; i-- ) {
            // Shorten array if possible
            if ( this.explosions[i] == null ) {
                this.explosions.length = i;
            } else {
                break;
            }
        }
    }



    //------------
    getRecyclableExplosionIndex( ) {

        let i;
        for ( i = 0 ; i < this.explosions.length ; i++ ) {
            if ( this.explosions[i] == null ) {
                return i;
            }
        }
        return -1;
    }


    //------------
    getRecyclableExplosion( type ) {

        let i;
        for ( i = 0 ; i < this.explosions.length ; i++ ) {
            if ( this.explosions[i] != null && this.explosions[i].type == type && this.explosions[i].visible == 0 ) {
                return i;
            }
        }
        return -1;
    }



    //---------
    createExplosion( location_v3 ,  owner ,  scale_x , scale_y , explosion_type, damage , damage_building , wait_buffer ) {

        let explosion:Txexplosion;
        let recyclable_index = this.getRecyclableExplosion( explosion_type );

        let material = this.shared_explosion_material;

        if ( explosion_type == 1 ) {
            material = this.shared_explosion_material;
            
        } else if ( explosion_type == 2 ) {
            material = this.shared_zap_material;
            
        }


        
        if ( recyclable_index >= 0 ) {

            // Reuse entity
            explosion = this.explosions[recyclable_index];
            explosion.getComponent(Transform).position = location_v3;
            explosion.getComponent(Transform).scale.x    = scale_x ;
            explosion.getComponent(Transform).scale.x    = scale_y ;
                
            explosion.damage = damage;
            explosion.owner  = owner;
            explosion.tick = explosion.tick_per_frame;
            explosion.frame_index = 0;

            explosion.visible = 1;
            

        } else {
            
            // constructor( id, parent , transform_args  , shared_material , owner, type,  damage ,  damage_building ) 

            explosion = new Txexplosion(
                this.explosions.length,
                this,
                {
                    position: location_v3,
                    scale   : new Vector3( scale_x, scale_y , 1 )
                },
                material,
                owner,
                explosion_type,
                damage,
                damage_building
            ) ;
            
            recyclable_index = this.getRecyclableExplosionIndex();

            if ( recyclable_index == -1 ) {
                this.explosions.push( explosion );

            } else {
                // Reuse index.
                explosion.id = recyclable_index;
                this.explosions[recyclable_index] = explosion;
            }
        }

        explosion.dead = 3;
        explosion.wait_buffer = wait_buffer;
        explosion.getComponent( PlaneShape ).uvs = explosion.getUV_coord();

        
       // log( "Explosion " , explosion.id , " inited. arr len", this.explosions.length );
            
        return explosion;
    }

















    //------------------
    removeProjectile( p ) {

        engine.removeEntity( this.projectiles[ p.id ] );
        this.projectiles[ p.id ] = null;

        let i;
        for ( i =  this.projectiles.length - 1 ; i >= 0 ; i-- ) {
            // Shorten array if possible
            if ( this.projectiles[i] == null ) {
                this.projectiles.length = i;
            } else {
                break;
            }
        }
    }





     //------------
    getRecyclableProjectileIndex() {

        let i;
        for ( i = 0 ; i < this.projectiles.length ; i++ ) {
            if ( this.projectiles[i] == null ) {
                return i;
            }
        }
        return -1;
    
    }

    //--------
    getRecyclableProjectile( type ) {

        let i;
        for ( i = 0 ; i < this.projectiles.length ; i++ ) {
            if ( this.projectiles[i] != null  && this.projectiles[i].type == type && this.projectiles[i].visible == 0 ) {
                return i;
            }
        }
        return -1;
    
    }



    //------------
    createProjectile( src_v3, dst_v3 , owner , projectile_type , attacktarget, damage , damage_building , wait_buffer ) {


        let projectile:Txprojectile;
        
        let shape ;
        if ( projectile_type == 1 ) {

            shape = resources.models.arrow;
            
        } else if ( projectile_type == 2  ) {

            shape = this.shared_fireball_shape;
            

        } else if ( projectile_type == 3 ) {

            shape = this.shared_fireball_shape;
            
        }


        let recyclable_index = this.getRecyclableProjectile( projectile_type );
        
        if ( recyclable_index >= 0 ) {

            // Reuse entity
            projectile = this.projectiles[recyclable_index];
            projectile.getComponent(Transform).position = src_v3;
            projectile.src_v3                           = src_v3;
            projectile.dst_v3                           = dst_v3;
            projectile.attacktarget = attacktarget;
            projectile_type = projectile_type;
            projectile.damage = damage;
            projectile.damage_building = damage_building;
            projectile.owner  = owner;
            projectile.tick   = 0;
            projectile.visible = 1;
            

           // log("Reusing projectile" , "type", projectile.type, "id" , projectile.id , "arrlen", this.projectiles.length );

        } else {

            //  constructor( id, parent , shape, src_v3, dst_v3  , owner,  type, attacktarget ,  damage , damage_building ) {

            projectile = new Txprojectile(
                this.projectiles.length,
                this,
                shape,
                src_v3, 
                dst_v3,
                owner,
                projectile_type,
                attacktarget,
                damage,
                damage_building,
            );

            if ( projectile_type == 1 ) {
                // Arrow
                projectile.speed = 4.5;

            } else if ( projectile_type == 2 ) {
                // Fireball
                projectile.speed = 3.5;
                projectile.getComponent( Transform ).scale.setAll(0.5);
                projectile.addComponent( this.shared_fireball_material );
                projectile.addComponent( new Billboard() );
            
            } else if ( projectile_type == 3 ) {
                // Spell fireball
                projectile.speed = 10;
                projectile.getComponent( Transform ).scale.setAll(1.5);
                projectile.addComponent( this.shared_fireball_material );
                projectile.addComponent( new Billboard() );
            
            }
            

            recyclable_index = this.getRecyclableProjectileIndex();
            if ( recyclable_index == -1 ) {    
                this.projectiles.push( projectile );

             //   log("Initing new projectile" , "type", projectile.type, "id" , projectile.id , "arrlen", this.projectiles.length );

            
            } else {
                // Reuse index
                projectile.id = recyclable_index;
                this.projectiles[recyclable_index] = projectile 

            //    log("Initing new projectile reusing index" , "type", projectile.type, "id" , projectile.id , "arrlen", this.projectiles.length );

            
            }
        }

        projectile.dead = 3;
        projectile.wait_buffer = wait_buffer;
        if ( projectile_type == 2 || projectile_type == 3 ) {
            projectile.getComponent( PlaneShape ).uvs = projectile.getUV_coord();
        }

        //log( "Projectile " , "type:", projectile.type, "id:", projectile.id , " inited. arr len", this.projectiles.length );
        return projectile;
    }















    //------------
    getRecyclableUnitIndex( ) {
        let i;
        for ( i = 6 ; i < this.units.length ; i++ ) {
            if ( this.units[i] == null ) {
                return i;
            }
        }
        return -1;
    }


    //------------
    getRecyclableUnit( type ) {
        let i;
        for ( i = 6 ; i < this.units.length ; i++ ) {
            if ( this.units[i] != null && this.units[i].visible == 0 && this.units[i].type == type ) {
                return i;
            }
        }
        return -1;
    }






    //------------------
    removeUnit( u ) {

        log( "Removing unit", u.id );

        try {
            this.world.DestroyBody( u.box2dbody );
        } catch (error) {
            log( u.id, "Error this.world.DestroyBody", error, "nvm continue.");
        }
        
        engine.removeEntity( this.units[ u.id ] );
        this.units[ u.id ] = null;


        let i;
        for ( i =  this.units.length - 1 ; i >= 0 ; i-- ) {
            // Shorten array if possible
            if ( this.units[i] == null ) {
                this.units.length = i;
            } else {
                break;
            }
        }
    }
 

    //---------------------
    spawnUnit( type , x, z , owner , wait_buffer ) {




        this.createClock( new Vector3(x, 3.0 ,z ) , wait_buffer );
                
       if ( type == "spell_fireball" ) {
            
            // createProjectile( src_v3, dst_v3 , owner , projectile_type , attacktarget, damage , damage_building ) {

            this.createProjectile(  
                new Vector3(0,  10 , 0),
                new Vector3(x,   2, z),
                owner,
                3,
                null,
                572,
                172,
                wait_buffer
            );

        } else if ( type == "spell_zap" ) {
            
            this.createExplosion( 
                    new Vector3( x , 1.5 , z ), 
                    owner, 
                    3,
                    3,
                    2,
                    159,
                    48,
                    wait_buffer
                );

       
        } else { 
            this.createUnit( type, x  , z , owner, wait_buffer );
        } 

        
    }


    /*
        
                                Dmg         HP          Hitspeed  Radius
        Skeleton                67          67            1
        Giant                   211         3275        1.5             
        Knight                  167         1452        1.2
        Archer                   89         252         1.2
        Wizard                  234         598         1.4
        Goblin                   90         167         1.1
        Megaminion              161         695         1.6
        MinionHorde              84         190           1


        Fireball                572(172)                            2.5                 
        Zap                     159(48)                             2.5
        Goblin Hut              
        Tomb Stone                                  
        Hogrider                264         1408       1.6
        Prince                  325         1669       1.4
        Goblin Spear             67         110        1.7
        Pekka                   678         3125       1.8

    */

    //---------------------
    createUnit( type , x, z , owner, wait_buffer  ) {

    	//log( "createUnit" , type, owner, "wait_buffer", wait_buffer, "gtick", this.globaltick );

    	let y ;
    	let modelsize;
    	let b2dsize;
    	let model;
        let model2 = null;
    	
        let isFlying     = 0;
        let isSpawner     = 0;

        let speed        = 5;
        let maxhp:number = 67;
        
        let attackSpeed  = 30;
        let damage:number = 67;

        let healthbar_y  = 3;
        let projectile_user = 0;

        let attack_building_only = 0;

        let attackRange = 0.3;
        let aggrorange  = 3.0;

        let shapetype   = "dynamic";
    	

    	if ( type == "skeleton" ) {
    		y 			= 1.6;
    		modelsize 	= 0.15;
    		b2dsize  	= 0.15;
    		model 		= resources.models.skeleton;

            damage      = 7;
            maxhp       = 270;
            attackSpeed = 30;

            speed       = 15;

            this.sounds["skeletonhit"].playOnce();
           
    	
    	} else if ( type == "giant" ) {

    		y 			= 1.85;
    		modelsize 	= 0.20;
    		b2dsize  	= 0.25;
    		model 		= resources.models.giant;

            damage      = 21;
            maxhp       = 8175;
            attackSpeed = 45;

            speed       = 14;

            healthbar_y = 4;
            attack_building_only = 1;

            this.sounds["burp"].playOnce();
            
                
    	
    	} else if ( type == "knight" ) {

    		y 			= 1.71;
    		modelsize 	= 0.18
    		b2dsize  	= 0.15;
    		model 		= resources.models.knight;

            damage      = 16;
            maxhp       = 1452;
            attackSpeed = 36;

            speed       = 15;


    	
    	} else if ( type == "archer" ) {

    		y 			= 1.65;
    		modelsize 	= 0.15;
    		b2dsize  	= 0.15;
    		model 		= resources.models.archer;
            

            damage      = 9;
            maxhp       = 252;
            attackSpeed = 36;
            
            speed       = 19;



            attackRange = 5.0;
            projectile_user = 1;




    	
    	} else if ( type == "wizard" ) {

    		y 			= 1.65;
    		modelsize 	= 0.15;
    		b2dsize  	= 0.15;
    		model 		= resources.models.wizard;

    	    damage      = 23;
            maxhp       = 598;
            attackSpeed = 42;
            
            speed       = 16;

            attackRange = 5.0;
            projectile_user = 1;
            

    	
    	} else if ( type == "goblin" ) {

    		y 			= 1.6;
    		modelsize 	= 0.15;
    		b2dsize  	= 0.15;
    		model 		= resources.models.goblin;
    		speed 		= 5.0;

    		damage      = 9;
            maxhp       = 267;
            attackSpeed = 33;
            
            speed       = 33;
            attackRange = 0.6;


    	} else if ( type == "gargoyle" ) {
    		
    		y 			= 3.5;
    		modelsize 	= 0.28;
    		b2dsize  	= 0.28;
    		model 		= resources.models.gargoyle;
    		isFlying    = 1;
            
            damage      = 15;
            maxhp       = 6195;
            attackSpeed = 48;
            speed       = 18;

            this.sounds["gargoyle"].playOnce();

    	} else if ( type == "gargoylehorde" ) {
    		y 			= 3.5;
    		modelsize 	= 0.18;
    		b2dsize  	= 0.18;
    		model 		= resources.models.gargoyle;
    		isFlying    = 1;
            
            damage      = 8;
            maxhp       = 50;
            attackSpeed = 30;

            speed       = 19;

            this.sounds["gargoyle"].playOnce();
            
            
    	} else if ( type == "goblinspear" ) {
            y           = 1.6;
            modelsize   = 0.15;
            b2dsize     = 0.15;
            model       = resources.models.goblinspear;
            
            damage      = 6;
            maxhp       = 110;
            attackSpeed = 33;


            speed       = 40;

            attackRange = 5.0;
            projectile_user = 1;


        } else if ( type == "prince" ) {

            y           = 1.85;
            modelsize   = 0.18;
            b2dsize     = 0.15;
            model       = resources.models.prince;
            

            damage      = 32;
            maxhp       = 15669;
            attackSpeed = 42;

            speed       = 43;

            attackRange = 0.6;
        

            this.sounds["horse"].playOnce();



        } else if ( type == "hogrider" ) {

            y           = 1.85;
            modelsize   = 0.15;
            b2dsize     = 0.15;
            model       = resources.models.hogrider;
            
            damage      = 26;
            maxhp       = 2408;
            attackSpeed = 48;
            speed       = 45;

             attack_building_only = 1;

            this.sounds["pig"].playOnce();
            attackRange = 0.4;


        } else if ( type == "pekka" ) {

            y           = 1.6;
            modelsize   = 0.15;
            b2dsize     = 0.2;
            model       = resources.models.pekka;

            damage      = 67;
            maxhp       = 23125;
            attackSpeed = 54;
            speed       = 14.5;
            healthbar_y = 5.5;

            attackRange = 0.62;





        } else if ( type == "tombstone" ) {

            y           = 1.55;
            modelsize   = 0.24;
            b2dsize     = 0.24;
            model       = resources.models.tombstone;

            damage      = 0;
            maxhp       = 422;
            attackSpeed = 120;
            speed       = 0;
            isSpawner    = 1;


         } else if ( type == "goblinhut" ) {

            y           = 1.85;
            modelsize   = 0.26;
            b2dsize     = 0.3;
            model       = resources.models.goblinhut;

            damage      = 0;
            maxhp       = 844;
            attackSpeed = 135;
            speed       = 0;
            isSpawner    = 1;
        







        } else if ( type == "towerarcher" ) {

            y           = 1.41;
            modelsize   = 1.0;
            b2dsize     = 1.0;
            
            model       = this.shared_box;
            model2      = resources.models.archer;
            
            damage      = 89;
            maxhp       = 252;
            attackSpeed = 36;
            
            speed       = 0;

            healthbar_y  = 2;
            attackRange = 5.0;
            projectile_user = 1;
    
            shapetype = "static";

        
        } else if ( type == "towerwizard" ) {

            y           = 1.41;
            modelsize   = 1.0;
            b2dsize     = 1.0;
            
            model       = this.shared_box;
            model2      = resources.models.wizard;
            
            damage      = 234;
            maxhp       = 598;
            attackSpeed = 42;
            
            speed       = 0;

            attackRange = 5.0;
            projectile_user = 1;
    
            shapetype = "static";


         } else if ( type == "towergoblinspear" ) {

            y           = 1.41;
            modelsize   = 1.0;
            b2dsize     = 1.0;
            
            model       = this.shared_box;
            model2      = resources.models.goblinspear;
            damage      = 67;
            maxhp       = 110;
            attackSpeed = 8;
            speed       = 0;
            attackRange = 4.5;
            projectile_user = 1;
    
            shapetype = "static";    




        } else if ( type == "towerknight" ) {

            y           = 1.41;
            modelsize   = 1.0;
            b2dsize     = 1.0;
            
            model       = this.shared_box;
            model2      = resources.models.knight;
            damage      = 167;
            maxhp       = 1452;
            attackSpeed = 36;
            speed       = 0;
            attackRange = 1.5;
            projectile_user = 0;
    
            shapetype = "static";    
            

        } else if ( type == "emptyblock" ) {

            y           = 1.41;
            modelsize   = 1.0;
            b2dsize     = 1.0;
            
            model       = this.shared_box;
            model2      = "";
            damage      = 0;
            maxhp       = 1000;
            attackSpeed = 0;
            speed       = 0;
            attackRange = 0;
            projectile_user = 0;
            shapetype = "static";
        }







        

        let unit:Txunit;
        let recyclable_index = this.getRecyclableUnit( type );

        if ( recyclable_index >= 0 ) {

            unit = this.units[recyclable_index];
            unit.transform.position = new Vector3( x, y, z );
            unit.transform.scale    = new Vector3( modelsize, modelsize, modelsize );
            unit.owner = owner;
            
            unit.isFlying = isFlying;
            unit.aggroRange = aggrorange;
                
            if ( unit.owner == 1 ) {
                unit.healthbar.getComponent( Material ).albedoColor = Color3.FromInts( 255, 0, 0 );
            } else {
                unit.healthbar.getComponent( Material ).albedoColor = Color3.FromInts( 0, 0, 200 );
            }
            unit.tick = 0;
            unit.wait_buffer = wait_buffer;
            unit.dead = 3;
            unit.attacktarget = null ;
            unit.movetarget   = null ;
            unit.attacking    = 0;
            unit.healthbar.getComponent( Transform ).scale.x = 1.5;
            unit.stopAnimation("Punch");
            unit.playAnimation("Walking",1);
            unit.visible = 1;



            //log( "reuse unit entity " , unit.type, unit.id , " inited. arr len", this.units.length );

        } else {

           

            unit = new Txunit(
                        this.units.length,
                        this,
                        {
                            position: new Vector3( x , y ,  z ),
                            scale   : new Vector3( modelsize, modelsize, modelsize )
                        },
                        {
                            scale   : new Vector3( b2dsize , b2dsize , b2dsize )
                        },
                        model,
                        type,
                        shapetype,
                        owner,
                        isFlying,
                        aggrorange,
                        healthbar_y,
                        wait_buffer,
                        model2
                    );

            
            recyclable_index = this.getRecyclableUnitIndex();

            if ( recyclable_index == -1 ) {
                this.units.push( unit );
            } else {
                unit.id = recyclable_index;
                this.units[recyclable_index] = unit;
            }	
        
           // log( "Unit " , unit.type, unit.id , " inited. arr len", this.units.length );
        
        }



        if ( unit.owner == -1 ) {
            
            let ori_maxhp = maxhp;
            let extra_hp  = 0;

            let ori_speed = speed; 
            let extra_speed = 0;

            extra_hp = ori_maxhp * (  Math.pow(2, this.current_wave / 10)  )  ;
            
            if ( this.current_wave >= 10 ) {
                extra_speed = this.current_wave / 10 * this.difficulty ;
            }
            
            maxhp = (ori_maxhp + extra_hp )   * this.difficulty;
            speed = (ori_speed + extra_speed) ;
        }





        unit.curhp       = maxhp;
        unit.maxhp       = maxhp;
        unit.curlvl      = 1;
    	unit.attackRange = attackRange;
    	unit.speed 		 = speed;
        unit.attackSpeed = attackSpeed;
        unit.damage      = damage;
        unit.projectile_user = projectile_user;
        unit.attack_building_only = attack_building_only;
        unit.dead       = 3;
        unit.isSpawner  = isSpawner;
        unit.rage       = 0;
        unit.walking_queue.length = 0;
            
        if ( unit.owner == -1 ) {
            unit.transform.rotation.eulerAngles = new Vector3( 0, 180 ,0) ;
        } else {
            unit.transform.rotation.eulerAngles = new Vector3( 0, 0 ,0) ;
        }        

        this.sounds["spawn"].playOnce();

        //unit.speed = 0;
        
    	
		
    	return unit;
    }
































    //--------------------------
    //
    //      Box2D Section
    //
    //--------------------------


	//-----------------
	construct_box2d_shapes( ) {

    	let vertices = [];	
    	let xoffset = 0;
    	let yoffset = 0;
		
        vertices.length = 0 ;
        vertices.push(  new b2Vec2(   -7 * this.grid_size_x,    1.5* this.grid_size_z   ) ); 
        vertices.push(  new b2Vec2(   -6.5* this.grid_size_x,  1.5* this.grid_size_z   ) );   
        vertices.push(  new b2Vec2(   -6.5* this.grid_size_x,  6.5* this.grid_size_z   ) );   
        vertices.push(  new b2Vec2(   -7* this.grid_size_x,    6.5 * this.grid_size_z  ) );   

        this.createStaticShape( xoffset , yoffset , vertices , this.world );

        vertices.length = 0 ;
        vertices.push(  new b2Vec2(   6.5* this.grid_size_x,    1.5 * this.grid_size_z  ) ); 
        vertices.push(  new b2Vec2(   7* this.grid_size_x,      1.5 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(   7* this.grid_size_x,      6.5 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(   6.5* this.grid_size_x,    6.5 * this.grid_size_z  ) );   

        this.createStaticShape( xoffset , yoffset , vertices , this.world );

        vertices.length = 0 ;
        vertices.push(  new b2Vec2(   -7* this.grid_size_x,    -6.5 * this.grid_size_z  ) ); 
        vertices.push(  new b2Vec2(   -6.5* this.grid_size_x,  -6.5 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(   -6.5* this.grid_size_x,  -1.5* this.grid_size_z   ) );   
        vertices.push(  new b2Vec2(   -7* this.grid_size_x,    -1.5 * this.grid_size_z  ) );   

        this.createStaticShape(xoffset , yoffset , vertices , this.world );

        vertices.length = 0 ;
         vertices.push(  new b2Vec2(  6.5* this.grid_size_x,    -6.5 * this.grid_size_z  ) ); 
        vertices.push(  new b2Vec2(   7* this.grid_size_x,      -6.5 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(   7* this.grid_size_x,      -1.5 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(   6.5* this.grid_size_x,    -1.5 * this.grid_size_z  ) );   
        
        this.createStaticShape(xoffset , yoffset , vertices , this.world );



        vertices.length = 0 ;
        vertices.push(  new b2Vec2(   -7* this.grid_size_x,    6.5 * this.grid_size_z  ) ); 
        vertices.push(  new b2Vec2(    7* this.grid_size_x,    6.5 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(    7* this.grid_size_x,     7 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(   -7* this.grid_size_x,     7 * this.grid_size_z  ) );   
        
        this.createStaticShape( xoffset , yoffset , vertices , this.world );


        vertices.length = 0 ;
        vertices.push(  new b2Vec2(   -7* this.grid_size_x,   -7 * this.grid_size_z  ) ); 
        vertices.push(  new b2Vec2(    7* this.grid_size_x,   -7 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(    7* this.grid_size_x,   -6.5 * this.grid_size_z  ) );   
        vertices.push(  new b2Vec2(   -7* this.grid_size_x,   -6.5 * this.grid_size_z  ) );   
        
        this.createStaticShape( xoffset , yoffset , vertices , this.world );
        
       

	}

	//----------
    createStaticShape( x, y , vertices, world ) {
    	return this.createShape( x, y, world,  b2BodyType.b2_staticBody, vertices );
    }

     //------------
    createShape( x, y, world, body_type , vertices  ) {

    	let bodyDef   = new b2BodyDef();
        bodyDef.position.Set( x , y );
        bodyDef.type 	= body_type;
		
        let fixDef          = new b2FixtureDef();
        fixDef.density      = 10;
        fixDef.friction     = 100;
        fixDef.restitution  = 0.5;
        fixDef.shape        = new b2PolygonShape();

        fixDef.shape.Set( vertices , vertices.length );

        let b2body = world.CreateBody(bodyDef);
        b2body.CreateFixture(fixDef);
        return b2body;
    }

    //-------------
    createDynamicBox( x, y , width , height , world  ) {
    	return this.createBox( x,y,width,height, world,  b2BodyType.b2_dynamicBody );
    }	
    //------------------
    createStaticBox( x, y , width , height , world  ) {
    	return this.createBox( x,y,width,height, world,  b2BodyType.b2_staticBody );
    }
    //-------------------
    createBox( x, y , width , height , world , body_type ) {
    	
    	let bodyDef   = new b2BodyDef();
        bodyDef.position.Set( x , y );
        bodyDef.type 	= body_type;
		
        let fixDef          = new b2FixtureDef();
        fixDef.density      = 1.0;
        fixDef.friction     = 0.00;
        fixDef.restitution  = 0.1;
        fixDef.shape        = new b2PolygonShape();
        fixDef.shape.SetAsBox( width/2 , height/2 );

        let b2body = world.CreateBody(bodyDef);
        b2body.CreateFixture(fixDef);

        return b2body;
    }

      //-------------
    createDynamicCircle( x, y , radius , world , ccd  ) {
    	return this.createCircle( x,y, radius , world,  b2BodyType.b2_dynamicBody , ccd );
    }		
	
	 //-------------
    createStaticCircle( x, y , radius , world  ) {
    	return this.createCircle( x,y, radius , world,  b2BodyType.b2_staticBody , false );
    }		

    //----------------
    createCircle( x,y, radius , world, body_type , ccd ) {

    	// Box2D
    	let bodyDef   = new b2BodyDef();
        bodyDef.position.Set( x , y );
        bodyDef.type 	= body_type;
        bodyDef.bullet  = ccd;
		
        let fixDef          = new b2FixtureDef();
        fixDef.density      = 20;
        fixDef.friction     = 100;
        fixDef.restitution  = 0.3;
       

        fixDef.shape        = new b2CircleShape(radius);
        
        let b2body = world.CreateBody(bodyDef);
        b2body.CreateFixture(fixDef);
        b2body.SetLinearDamping(1);
		b2body.SetAngularDamping(1);


        return b2body;

    }

    //-------------
    createDynamicSensorCircle( x,y, radius , world, sensorid ) {

    	// Box2D
    	let bodyDef   = new b2BodyDef();
        bodyDef.position.Set( x , y );
        bodyDef.type 	= b2BodyType.b2_dynamicBody;
        bodyDef.userData  = sensorid;
		
        let fixDef          = new b2FixtureDef();
        fixDef.density      = 0.0;
        fixDef.friction     = 0.0;
        fixDef.restitution  = 0.0;
        fixDef.shape        = new b2CircleShape(radius);
        fixDef.isSensor 	= true;
        
        let b2body = world.CreateBody(bodyDef);
        b2body.CreateFixture(fixDef);

        return b2body;

	}
}



