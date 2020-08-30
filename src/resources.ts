
export default {
	
	models: {
		
		battleground: new GLTFShape("models/battleground.glb"),
		tower_r: new GLTFShape("models/tower_r.glb"),
		tower_b: new GLTFShape("models/tower_b.glb"),
		

		skeleton: new GLTFShape("models/skeleton.glb"),
		giant: new GLTFShape("models/giant.glb"),
		knight: new GLTFShape("models/knight.glb"),
		archer: new GLTFShape("models/archer.glb"),
		wizard: new GLTFShape("models/wizard.glb"),
		goblin: new GLTFShape("models/goblin.glb"),
		gargoyle: new GLTFShape("models/gargoyle.glb"),
		goblinspear: new GLTFShape("models/goblinspear.glb"),
		prince: new GLTFShape("models/prince.glb"),
		hogrider: new GLTFShape("models/hogrider.glb"),
		pekka: new GLTFShape("models/pekka.glb"),
		goblinhut: new GLTFShape("models/goblinhut.glb"),
		tombstone: new GLTFShape("models/tombstone.glb"),
		arrow: new GLTFShape("models/arrow.glb"),
		scoreboard: new GLTFShape("models/scoreboard.glb"),
		ground: new GLTFShape("models/ground.glb")
	},
	textures: {
		skeleton: new Texture("models/skeleton_ui.png"),
		giant: new Texture("models/giant_ui.png"),
		knight: new Texture("models/knight_ui.png"),
		archer: new Texture("models/archer_ui.png"),
		wizard: new Texture("models/wizard_ui.png"),
		goblin: new Texture("models/goblin_ui.png"),
		gargoyle: new Texture("models/gargoyle_ui.png"),
		gargoylehorde: new Texture("models/gargoylehorde_ui.png"),
		spell_fireball: new Texture("models/spellfireball_ui.png"),
		spell_zap	  : new Texture("models/spellzap_ui.png"),
		prince: new Texture("models/prince_ui.png"),
		hogrider: new Texture("models/hogrider_ui.png"),
		goblinhut: new Texture("models/goblinhut_ui.png"),
		goblinspear: new Texture("models/goblinspear_ui.png"),
		tombstone: new Texture( "models/tombstone_ui.png"),
		pekka: new Texture("models/pekka_ui.png"),
		explosion: new Texture("models/explosion.png"),
		fireball: new Texture("models/fireball.png"),
		zap: new Texture("models/zap.png"),
		clock: new Texture("models/clock.png"),
		crown_r : new Texture("models/crown_r.png"),
		crown_b : new Texture("models/crown_b.png"),
		manabar: new Texture("models/manabar.png"),
		manaoutline: new Texture("models/manaoutline.png"),
		manaruler: new Texture("models/manaruler.png"),

		redflag: new Texture("models/redflag.png"),
		blueflag: new Texture("models/blueflag.png"),
		logo : new Texture("models/logo.png"),
		heart: new Texture("models/heart.png")
		

	},

	sounds: {
		whoosh: new AudioClip("sounds/whoosh.mp3"),
		explosion: new AudioClip("sounds/explosion.mp3"),
		warhorn: new AudioClip("sounds/warhorn.mp3"),
		electricshock: new AudioClip("sounds/electricshock.mp3"),
		arrowshoot: new AudioClip("sounds/arrowshoot.mp3"),
		arrowhit:new AudioClip("sounds/arrowhit.mp3"),
		swordhit:new AudioClip("sounds/swordhit.mp3"),
		organicdie: new AudioClip("sounds/organicdie.mp3"),
		skeletonhit: new AudioClip("sounds/skeletonhit.mp3"),
		punch: new AudioClip("sounds/punch.mp3"),
		destruction: new AudioClip("sounds/destruction.mp3"),
		spawn: new AudioClip("sounds/spawn.mp3"),
		endgame:new AudioClip("sounds/endgame.mp3"),
		scream:new AudioClip("sounds/scream.mp3"),
		buttonclick:new AudioClip("sounds/buttonclick.mp3"),
		denied: new AudioClip("sounds/denied.mp3"),
		horse: new AudioClip("sounds/horse.mp3"),
		gargoyle: new AudioClip("sounds/gargoyle.mp3"),
		pig: new AudioClip("sounds/pig.mp3"),
		burp:new AudioClip("sounds/burp.mp3"),
		wardrum:new AudioClip("sounds/wardrum.mp3"),
		medieval: new AudioClip("sounds/medieval.mp3"),
		pop:new AudioClip("sounds/pop.mp3");
	}


	
};



		









