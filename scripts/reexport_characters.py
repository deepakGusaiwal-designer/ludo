import bpy
import os
from mathutils import Vector

def process_file(blend_path, out_glb_path, target_height=0.68):
    print(f"\n--- Processing {os.path.basename(blend_path)} ---")
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    # Ensure in OBJECT mode
    if bpy.context.view_layer.objects.active and bpy.context.view_layer.objects.active.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    mesh_objs = [o for o in bpy.data.objects if o.type == 'MESH']
    if not mesh_objs:
        print("No mesh objects in", blend_path)
        return

    # Calculate combined bounding box in world space
    min_co = Vector((float('inf'), float('inf'), float('inf')))
    max_co = Vector((float('-inf'), float('-inf'), float('-inf')))

    for obj in mesh_objs:
        mat = obj.matrix_world
        for corner in obj.bound_box:
            world_corner = mat @ Vector(corner)
            min_co.x = min(min_co.x, world_corner.x)
            min_co.y = min(min_co.y, world_corner.y)
            min_co.z = min(min_co.z, world_corner.z)
            max_co.x = max(max_co.x, world_corner.x)
            max_co.y = max(max_co.y, world_corner.y)
            max_co.z = max(max_co.z, world_corner.z)

    size = max_co - min_co
    center = (min_co + max_co) / 2.0
    print(f"BBox: Size={size}, Center={center}, Min={min_co}, Max={max_co}")

    # Export to GLB
    bpy.ops.export_scene.gltf(
        filepath=out_glb_path,
        export_format='GLB',
        export_yup=True
    )
    print(f"Exported: {out_glb_path}")

if __name__ == "__main__":
    base_dir = "e:/Deepak/practice/Ludo/public/modal"
    process_file(f"{base_dir}/WOMAN-CUTIE.blend", f"{base_dir}/woman-cutie.glb", 0.65)
    process_file(f"{base_dir}/WOMAN-OFFICER.blend", f"{base_dir}/woman-officer.glb", 0.65)
