const elib = require("mechanical-warfare/effectlib");
const plib = require("mechanical-warfare/plib");

// Chemical Station
const chemicalStation = extendContent(LiquidConverter, "chemical-station", {
  load(){
    this.region = Core.atlas.find(this.name);
    this.liquidRegion = Core.atlas.find(this.name + "-liquid");
    this.topRegion = Core.atlas.find(this.name + "-top");
  },
  generateIcons: function(){
    return [
      Core.atlas.find(this.name),
      Core.atlas.find(this.name + "-top")
    ];
  },
  draw(tile){
    const entity = tile.ent();
    Draw.rect(this.region, tile.drawx(), tile.drawy());
    Draw.color(this.outputLiquid.liquid.color);
    Draw.alpha(entity.liquids.get(this.outputLiquid.liquid) / this.liquidCapacity);
    Draw.rect(this.liquidRegion, tile.drawx(), tile.drawy());
    Draw.color();
    Draw.rect(this.topRegion, tile.drawx(), tile.drawy());
  },
});

// Stone Centrifuge
const stoneCentrifuge = extendContent(GenericCrafter, "stone-centrifuge", {
  load(){
    this.region = Core.atlas.find(this.name)
    this.liquidRegion = Core.atlas.find(this.name + "-liquid");
    this.topRegion = Core.atlas.find(this.name + "-top");
  },
  generateIcons: function(){
    return [
      Core.atlas.find(this.name),
      Core.atlas.find(this.name + "-top")
    ];
  },
  draw(tile){
    Draw.rect(this.region, tile.drawx(), tile.drawy());
    Draw.color(tile.entity.liquids.current().color);
    Draw.alpha(tile.entity.liquids.total() / this.liquidCapacity);
    Draw.rect(this.liquidRegion, tile.drawx(), tile.drawy());
    Draw.color();
    Draw.rect(this.topRegion, tile.drawx(), tile.drawy());
  },
});

// Stone Grinder
const stoneGrinder = extendContent(GenericCrafter, "stone-grinder", {
  load(){
    this.bottomRegion = Core.atlas.find(this.name + "-bottom");
    this.rightRotatorRegion = Core.atlas.find(this.name + "-rotator1");
    this.leftRotatorRegion = Core.atlas.find(this.name + "-rotator2");
    this.topRegion = Core.atlas.find(this.name + "-top");
  },
  generateIcons: function(){
    return [
      Core.atlas.find(this.name)
    ];
  },
  draw(tile){
    const entity = tile.ent();
    const f = Vars.tilesize;
    Draw.rect(this.bottomRegion, tile.drawx(), tile.drawy());
    Draw.rect(this.rightRotatorRegion, tile.drawx() + 22 / f, tile.drawy() - 22 / f, entity.totalProgress * 2);
    Draw.rect(this.leftRotatorRegion, tile.drawx() - 20 / f, tile.drawy() + 20 / f, entity.totalProgress * -2);
    Draw.rect(this.topRegion, tile.drawx(), tile.drawy());
  },
});

// Insulating Compound
const electricBall = newEffect(10, e => {
	elib.fillCircle(e.x, e.y, Pal.lancerLaser, 1, e.fout() * 0.8);
});
const insulatingCompound = extendContent(GenericCrafter, "insulating-compound", {
	load(){
		this.super$load();
		this.region = Core.atlas.find(this.name);
		this.topRegion = Core.atlas.find(this.name + "-top");
	},
	draw(tile){
		this.super$draw(tile);
		var entity = tile.ent();
		Draw.alpha(entity.getBoltChance());
		Draw.rect(this.topRegion, tile.drawx(), tile.drawy());
		var alpha = (1 - Mathf.absin(Time.time(), 5, 0.3)) * entity.getBoltChance();
		var cr = Mathf.random(0.1);
		elib.fillCircle(tile.drawx(), tile.drawy(), Pal.lancerLaser, alpha, 2 + Mathf.absin(Time.time(), 5, 2) + cr);
		elib.fillCircle(tile.drawx(), tile.drawy(), Color.white, alpha, 0.7 + Mathf.absin(Time.time(), 5, 0.7) + cr);
		Draw.color();
	},
	update(tile){
		this.super$update(tile);
		var entity = tile.ent();
		if(entity.cons.valid()){
			if(entity.items.get(this.outputItem.item) != this.itemCapacity){
				entity.setBoltChance(Mathf.lerpDelta(entity.getBoltChance(), entity.power.status / 2, 0.02));
			}else{
				entity.setBoltChance(Mathf.lerpDelta(entity.getBoltChance(), 0, 0.02));
			}
		}else{
			entity.setBoltChance(Mathf.lerpDelta(entity.getBoltChance(), 0, 0.02));
		}
	},
	drawLayer2(tile){
		this.super$drawLayer2(tile);
		var entity = tile.ent();
		Draw.blend(Blending.additive);
		for(var i = 0; i < this.boltCount; i++){
			if(Mathf.randomSeed(Mathf.round(Time.time() + entity.id + i)) > entity.getBoltChance()){continue;}
			var rawrot = Time.time() * this.boltRotSpeed[i] * this.boltRotDir[i];
			var truerot =
				rawrot > 0 ?
					(rawrot % 360)
				:
					(360 + (rawrot % 360));
			Draw.mixcol(Color.white, Mathf.absin(Time.time(), this.boltRotSpeed[i] * 0.1, 0.5));
			Draw.alpha(0.9 + Mathf.absin(Time.time(), this.boltRotSpeed[i] * 0.1, 0.1));
			Draw.rect(Core.atlas.find(this.name + "-bolt" + i), tile.drawx(), tile.drawy(), truerot);
			Draw.mixcol();
			Draw.color();
		}
		Draw.blend();
		Draw.reset();
	}
});
insulatingCompound.layer2 = Layer.power;
insulatingCompound.boltCount = 3;
insulatingCompound.boltRotSpeed = [12, 9, 27, 23, 18, 15];
insulatingCompound.boltRotDir = [1, -1, -1, 1, 1, -1];
insulatingCompound.updateEffect = electricBall;
insulatingCompound.craftEffect = Fx.smeltsmoke;
insulatingCompound.entityType = prov(() => {
	const entity = extend(GenericCrafter.GenericCrafterEntity, {
		getBoltChance: function(){
			return this._chance;
		},
		setBoltChance: function(val){
			this._chance = val < 0.0001 ? 0 : val;
		}
	});
	entity.setBoltChance(0);
	return entity;
});

// MK2 Module Assembler
const mk2Assembler = extendContent(GenericCrafter, "mk2-assembler", {
  load(){
    this.region = Core.atlas.find(this.name);
    this.bottomRegion = Core.atlas.find(this.name + "-bottom");
    this.liquidRegion = Core.atlas.find(this.name + "-liquid");
  },
  generateIcons: function(){
    return [
      Core.atlas.find(this.name + "-bottom"),
      Core.atlas.find(this.name)
    ];
  },
  draw(tile){
    const entity = tile.ent();
    Draw.rect(this.bottomRegion, tile.drawx(), tile.drawy());
    Draw.color(Pal.accent);
    Draw.alpha(entity.warmup);
    Lines.lineAngleCenter(
      tile.drawx(),
      tile.drawy() + Mathf.sin(entity.totalProgress, 8, (Vars.tilesize - 1) * this.size / 2),
      0,
      (Vars.tilesize - 1) * this.size
    );
    Draw.reset();
    Draw.rect(this.region, tile.drawx(), tile.drawy());
    Draw.color(entity.liquids.current().color);
    Draw.alpha(entity.liquids.total() / this.liquidCapacity);
    Draw.rect(this.liquidRegion, tile.drawx(), tile.drawy());
    Draw.reset();
  }
});

