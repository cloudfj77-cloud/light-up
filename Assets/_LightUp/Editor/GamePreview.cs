using System;
using System.Reflection;
using UnityEditor;
using UnityEngine;

namespace LightUp.Editor
{
    public static class GamePreview
    {
        // GameView has no public zoom API. These members are pinned to our 2022.3 editor.
        // Reference: UnityCsReference/2022.3/Editor/Mono/GameView/GameView.cs
        [MenuItem("Light Up/Fit Sharp Game Preview")]
        public static void Fit()
        {
            const BindingFlags flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
            var type = typeof(EditorWindow).Assembly.GetType("UnityEditor.GameView", true);
            var window = EditorWindow.GetWindow(type);
            var lowResolution = type.GetProperty("lowResolutionForAspectRatios", flags);
            var selectedSize = type.GetProperty("selectedSizeIndex", flags);
            var zoomField = type.GetField("m_ZoomArea", flags);
            var updateZoom = type.GetMethod("UpdateZoomAreaAndParent", flags);
            if (lowResolution == null || selectedSize == null || zoomField == null || updateZoom == null)
                throw new NotSupportedException("GameView API changed. Select Free Aspect, disable Low Resolution Aspect Ratios, and set Scale to 1x manually.");
            selectedSize.SetValue(window, 0); // Free Aspect: render at the available panel resolution.
            lowResolution.SetValue(window, false);
            updateZoom.Invoke(window, null);
            var zoom = zoomField.GetValue(window);
            var setTransform = zoom.GetType().GetMethod("SetTransform", flags, null, new[] {typeof(Vector2), typeof(Vector2)}, null);
            if (setTransform == null) throw new NotSupportedException("GameView zoom API changed; set Scale to 1x manually.");
            setTransform.Invoke(zoom, new object[] {Vector2.zero, Vector2.one});
            type.GetField("m_defaultScale", flags)?.SetValue(window, 1f);
            window.Repaint();
            Debug.Log("LIGHT_UP_PREVIEW_FIT: native-resolution Free Aspect, Scale 1x, centered, low-resolution mode disabled.");
        }
    }
}
