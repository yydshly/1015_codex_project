"""Blender-only conversion of the MIT Rocketbox Male_Adult_01 to a local skinned GLB.

Run Blender in background with --python this_file -- --source CACHE --output OUTPUT.
The source directory contains the original FBX plus resized color/normal JPGs and opacity PNG.
Original geometry, UVs, vertex weights and skeleton are preserved; no animation clips are exported.
"""
import argparse
from pathlib import Path
import sys

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument("--source", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(args.source / "Male_Adult_01.fbx"))

for material in bpy.data.materials:
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    shader.inputs["Roughness"].default_value = .83
    shader.inputs["Metallic"].default_value = 0
    shader.inputs["Specular IOR Level"].default_value = .22
    stem = material.name
    color_path = args.source / (stem + "_color.jpg")
    if "opacity" in stem:
        color_path = args.source / (stem + "_color.png")
    image = bpy.data.images.load(str(color_path))
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    material.node_tree.links.new(tex.outputs["Color"], shader.inputs["Base Color"])
    if "opacity" in stem:
        material.node_tree.links.new(tex.outputs["Alpha"], shader.inputs["Alpha"])
        material.surface_render_method = 'DITHERED'
        material.alpha_threshold = .5
        material.use_backface_culling = False
    else:
        normal_path = args.source / (stem + "_normal.jpg")
        normal = nodes.new("ShaderNodeTexImage")
        normal.image = bpy.data.images.load(str(normal_path))
        normal.image.colorspace_settings.name = 'Non-Color'
        normal_map = nodes.new("ShaderNodeNormalMap")
        normal_map.inputs["Strength"].default_value = .45
        material.node_tree.links.new(normal.outputs["Color"], normal_map.inputs["Color"])
        material.node_tree.links.new(normal_map.outputs["Normal"], shader.inputs["Normal"])

objects = [obj for obj in bpy.context.scene.objects if obj.type in {'MESH', 'ARMATURE'}]
for obj in objects:
    obj.animation_data_clear()
points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == 'MESH' for corner in obj.bound_box]
low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
scale = 1.82 / (high.z - low.z)
container = bpy.data.objects.new('Rocketbox_Realistic_Human', None)
bpy.context.collection.objects.link(container)
for obj in objects:
    if obj.parent not in objects:
        transform = obj.matrix_world.copy()
        obj.parent = container
        obj.matrix_world = transform
container.scale = (scale,) * 3
container.location = (-scale * (low.x + high.x) / 2, -scale * (low.y + high.y) / 2, -scale * low.z)
bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
container.select_set(True)
for obj in objects:
    obj.select_set(True)
args.output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(args.output), export_format='GLB', use_selection=True,
                          export_animations=False, export_skins=True,
                          export_image_format='AUTO', export_texcoords=True,
                          export_normals=True, export_yup=True)
print('ROCKETBOX_EXPORT', args.output, args.output.stat().st_size, flush=True)
