import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RiverSpirit } from '../src/scene/forms.ts';
import type { SpiritMotion } from '../src/scene/forms.ts';

test('收袖、接答与驻步的袖面截面连续，不在手臂折返处翻转',()=>{
  const trim=new THREE.MeshStandardMaterial();
  const spirit=new RiverSpirit(trim);
  const poses:SpiritMotion[]=[
    {chapter:'apparition',stride:0,reply:0,gaze:0,dance:0},
    {chapter:'message',stride:0,reply:1,gaze:0,dance:0},
    {chapter:'dance',stride:.5,reply:0,gaze:0,dance:1},
    {chapter:'farewell',stride:0,reply:0,gaze:1,dance:0},
  ];
  try{
    for(const pose of poses){
      spirit.update(4,pose);
      for(const side of ['left','right']){
        const mesh=spirit.root.getObjectByName('spirit-sleeve-'+side) as THREE.Mesh;
        const p=mesh.geometry.attributes.position;
        const up=new THREE.Vector3(),previous=new THREE.Vector3();
        for(let row=0;row<=24;row++){
          up.fromBufferAttribute(p,row*33+8).sub(new THREE.Vector3().fromBufferAttribute(p,row*33+24)).normalize();
          if(row)assert.ok(up.dot(previous)>.5,pose.chapter+' '+side+' 第 '+row+' 截面突然翻转');
          previous.copy(up);
        }
      }
    }
  }finally{
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
    spirit.root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
    for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
  }
});
