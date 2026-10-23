import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { bankGeometry, bankHeightAt } from '../src/scene/forms.ts';

test('植被落脚高度与实际岸面三角形一致，不能悬空或深埋',()=>{
  const rx=14,rz=25,height=3.2,seed=14;
  const mesh=new THREE.Mesh(bankGeometry(rx,rz,height,seed),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  mesh.updateMatrixWorld();
  for(const a of [.35,1.7,3.9]){
    const u=Math.cos(a)*.72,v=Math.sin(a)*.72;
    const ray=new THREE.Raycaster(new THREE.Vector3(u*rx,10,v*rz),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObject(mesh)[0];
    assert.ok(hit,'岸面应在此处有实际三角形');
    const gap=Math.abs(bankHeightAt(u,v,height,seed)-hit.point.y);
    assert.ok(gap<.06,'落脚与岸面间隙 '+gap.toFixed(3)+' 超过容差');
  }
  mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();
});
