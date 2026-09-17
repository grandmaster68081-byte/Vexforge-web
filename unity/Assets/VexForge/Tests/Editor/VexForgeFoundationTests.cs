using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace VexForge.Tests
{
    public sealed class VexForgeFoundationTests
    {
        [Test]
        public void ProductIdentityIsCanonical()
        {
            Assert.AreEqual(
                "VEXFORGE",
                PlayerSettings.productName);
        }

        [Test]
        public void AndroidPackageIsCanonical()
        {
            Assert.AreEqual(
                "com.vexforge.android",
                PlayerSettings.applicationIdentifier);
        }
    }
}