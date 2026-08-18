import bpy
import math
from mathutils import Euler, Quaternion, Vector

def relax_character_and_export(blend_path, out_glb_path):
    print(f"\n==========================================")
    print(f"Relaxing arms for: {blend_path}")
    bpy.ops.wm.open_mainfile(filepath=blend_path)

    arm = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    if not arm:
        print("No armature found!")
        return

    # Select armature and set to POSE mode
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    pose_bones = arm.pose.bones

    # Check rotation mode for bones and rotate arms down
    left_arm = pose_bones.get("mixamorig:LeftArm")
    right_arm = pose_bones.get("mixamorig:RightArm")
    left_forearm = pose_bones.get("mixamorig:LeftForeArm")
    right_forearm = pose_bones.get("mixamorig:RightForeArm")

    # In Mixamo rigs, rotating LeftArm around Z or X brings the arm down
    # Let's inspect bone rotation mode
    def rotate_bone_euler(pb, x_deg=0, y_deg=0, z_deg=0):
        if not pb:
            return
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler = Euler((math.radians(x_deg), math.radians(y_deg), math.radians(z_deg)), 'XYZ')

    # Mixamo arms relaxed pose angles:
    # Left arm: rotate down ~55 deg, slightly forward ~5 deg, slight inward twist
    # Right arm: mirror
    # Let's check Mixamo bone axes: Bone goes along +Y
    # Rotating around +Z tilts arm downwards for LeftArm, and -Z for RightArm
    rotate_bone_euler(left_arm, x_deg=5, y_deg=10, z_deg=52)
    rotate_bone_euler(right_arm, x_deg=5, y_deg=-10, z_deg=-52)

    # Forearms: slightly bent towards torso
    rotate_bone_euler(left_forearm, x_deg=0, y_deg=0, z_deg=12)
    rotate_bone_euler(right_forearm, x_deg=0, y_deg=0, z_deg=-12)

    # Apply current pose as new rest pose so it becomes the permanent base geometry
    bpy.ops.pose.select_all(action='SELECT')
    try:
        bpy.ops.pose.armature_apply(selected=False)
        print("Applied pose as rest pose successfully.")
    except Exception as e:
        print("pose.armature_apply note:", e)

    bpy.ops.object.mode_set(mode='OBJECT')

    # Export to GLB
    bpy.ops.export_scene.gltf(
        filepath=out_glb_path,
        export_format='GLB',
        export_yup=True
    )
    print(f"Successfully exported relaxed character to: {out_glb_path}")

if __name__ == "__main__":
    base_dir = "e:/Deepak/practice/Ludo/public/modal"
    relax_character_and_export(f"{base_dir}/WOMAN-CUTIE.blend", f"{base_dir}/woman-cutie.glb")
    relax_character_and_export(f"{base_dir}/WOMAN-OFFICER.blend", f"{base_dir}/woman-officer.glb")
