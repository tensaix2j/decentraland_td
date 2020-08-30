


import resources from "src/resources";


export class Txscoreboard extends Entity {

	
	public id;
	public parent;
	public transform;
	public visible = 1;

	public scorenumber_r;
	public scorenumber_b;

	constructor( id, parent , transform_args ) {

		super();
		engine.addEntity(this);
		this.setParent( parent );

		this.id = id;
		this.parent = parent;
		
		this.transform =  new Transform( transform_args );
		this.addComponent( resources.models.scoreboard );
		this.addComponent( this.transform );
		//this.addComponent( new Billboard() );
		
		let scorenumber_r = new Entity();
		scorenumber_r.setParent( this );
		scorenumber_r.addComponent( new TextShape("0") );
		scorenumber_r.addComponent( new Transform( {
			position: new Vector3( 0.54 , -0.30 ,  0.25 ),
			scale : new Vector3( 0.5,  0.5,  0.5)
		}));
		scorenumber_r.getComponent( TextShape ).color = Color3.Black();
		scorenumber_r.getComponent( Transform ).rotation.eulerAngles = new Vector3( 0 , 180, 0 );
		
		this.scorenumber_r = scorenumber_r;

		let scorenumber_b = new Entity();
		scorenumber_b.setParent( this );
		scorenumber_b.addComponent( new TextShape("0") );
		scorenumber_b.addComponent( new Transform( {
			position: new Vector3( -0.54 , -0.30 ,  0.25 ),
			scale : new Vector3( 0.5,  0.5,  0.5)
		}));
		scorenumber_b.getComponent( Transform ).rotation.eulerAngles = new Vector3( 0 , 180, 0 );

		scorenumber_b.getComponent( TextShape ).color = Color3.Black();
		this.scorenumber_b = scorenumber_b;
	}


	//-------------------------------
	refresh_score( score_r, score_b ) {

		this.scorenumber_r.getComponent( TextShape ).value = score_r + "";
		this.scorenumber_b.getComponent( TextShape ).value = score_b + "";
			
	}

}

