using UnityEngine;

namespace Vexforge.Tier1
{
    public enum VexforgeTier1Quality { Mobile, Balanced, Cinematic }
    public sealed class VexforgeTier1QualityDirector : MonoBehaviour
    {
        public VexforgeTier1Quality Current { get; private set; }
        public void Initialize()
        {
            var mem=SystemInfo.graphicsMemorySize;var cores=SystemInfo.processorCount;var shader=SystemInfo.graphicsShaderLevel;var maxRes=Mathf.Max(Screen.width,Screen.height);
            if(mem>=4096&&cores>=8&&shader>=45&&maxRes>=1800)Current=VexforgeTier1Quality.Cinematic;
            else if(mem>=2048&&cores>=6&&shader>=35&&maxRes>=1400)Current=VexforgeTier1Quality.Balanced;
            else Current=VexforgeTier1Quality.Mobile;
            Apply();
        }
        private void Apply()
        {
            switch(Current)
            {
                case VexforgeTier1Quality.Cinematic:QualitySettings.shadowDistance=48f;QualitySettings.antiAliasing=2;Application.targetFrameRate=60;break;
                case VexforgeTier1Quality.Balanced:QualitySettings.shadowDistance=34f;QualitySettings.antiAliasing=2;Application.targetFrameRate=45;break;
                default:QualitySettings.shadowDistance=20f;QualitySettings.antiAliasing=0;Application.targetFrameRate=30;break;
            }
        }
    }
}
