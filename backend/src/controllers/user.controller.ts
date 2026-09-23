import express from 'express'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { imageSize } from 'image-size'
import UserModel from '../models/user'
import { UPLOADS_DIR } from '../config/upload'
import { env } from '../config/env'
import { sendPasswordResetEmail } from '../utils/mail'

const PASSWORD_REGEX = /^(?=.{8,12}$)(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].*$/
const MATICNI_BROJ_REGEX = /^\d{8}$/
const PIB_REGEX = /^[1-9]\d{8}$/

export class UserController {
  // POST /users/register
  register = async (req: express.Request, res: express.Response) => {
    try {
      const { username, password, ime, prezime, telefon, email, tip, lice } = req.body
      let { institucija } = req.body

      if (typeof institucija === 'string') {
        try {
          institucija = JSON.parse(institucija)
        } catch {
          institucija = undefined
        }
      }

      if (!username || !password || !ime || !prezime || !telefon || !email || !tip)
        return res.status(400).json({ message: 'Missing required fields' })

      if (tip !== 'klijent' && tip !== 'stampar')
        return res.status(400).json({ message: 'Invalid user type' })

      if (tip === 'klijent' && lice !== 'fizicko' && lice !== 'pravno')
        return res.status(400).json({ message: 'Client must be fizicko or pravno lice' })

      if (!PASSWORD_REGEX.test(password))
        return res.status(400).json({
          message:
            'Password must be 8–12 chars, start with a letter, and contain an uppercase letter, a digit and a special character',
        })

      if (await UserModel.findOne({ username }))
        return res.status(400).json({ message: 'Username already taken' })
      if (await UserModel.findOne({ email: email.toLowerCase() }))
        return res.status(400).json({ message: 'Email already registered' })

      const needsInstitution = tip === 'stampar' || (tip === 'klijent' && lice === 'pravno')
      if (needsInstitution) {
        if (
          !institucija ||
          !institucija.naziv ||
          !institucija.adresaSedista ||
          !institucija.grad ||
          !institucija.maticniBroj ||
          !institucija.pib
        )
          return res.status(400).json({ message: 'Missing institution data' })

        if (!MATICNI_BROJ_REGEX.test(institucija.maticniBroj))
          return res.status(400).json({ message: 'maticniBroj must be exactly 8 digits' })
        if (!PIB_REGEX.test(institucija.pib))
          return res.status(400).json({ message: 'pib must be 9 digits and must not start with 0' })

        if (await UserModel.findOne({ 'institucija.maticniBroj': institucija.maticniBroj }))
          return res.status(400).json({ message: 'maticniBroj already registered' })
        if (await UserModel.findOne({ 'institucija.pib': institucija.pib }))
          return res.status(400).json({ message: 'pib already registered' })
      }

      // parse profile picture
      let profilna: string | undefined = undefined
      const file: any = (req as any).file
      if (file) {
        let dim
        try {
          dim = imageSize(file.buffer)
        } catch {
          return res.status(400).json({ message: 'Invalid image file' })
        }
        if (!dim.type || !['jpg', 'png', 'gif'].includes(dim.type))
          return res.status(400).json({ message: 'Profile image must be JPG, PNG or GIF' })
        if (
          !dim.width ||
          !dim.height ||
          dim.width < 100 ||
          dim.height < 100 ||
          dim.width > 250 ||
          dim.height > 250
        )
          return res
            .status(400)
            .json({ message: 'Profile image must be between 100x100 and 250x250 px' })

        profilna = `${randomUUID()}.${dim.type}`
        fs.writeFileSync(path.join(UPLOADS_DIR, profilna), file.buffer)
      }

      const status = tip === 'klijent' && lice === 'fizicko' ? 'odobren' : 'neodobren'

      const passwordHash = bcrypt.hashSync(password, 10)

      const created = await UserModel.create({
        username,
        passwordHash,
        ime,
        prezime,
        telefon,
        email: email.toLowerCase(),
        tip,
        lice: tip === 'stampar' ? 'pravno' : lice,
        status,
        profilna,
        institucija: needsInstitution
          ? {
              naziv: institucija.naziv,
              adresaSedista: institucija.adresaSedista,
              grad: institucija.grad,
              maticniBroj: institucija.maticniBroj,
              pib: institucija.pib,
              lokacija: institucija.lokacija,
            }
          : undefined,
      })

      const obj: any = created.toObject()
      delete obj.passwordHash
      return res.status(201).json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/login
  login = async (req: express.Request, res: express.Response) => {
    try {
      const { username, password } = req.body
      if (!username || !password)
        return res.status(400).json({ message: 'Missing credentials' })

      const user = await UserModel.findOne({ username })
      if (!user || !bcrypt.compareSync(password, user.passwordHash))
        return res.status(401).json({ message: 'Invalid username or password' })

      // Registered but not yet approved by an admin.
      if (user.status !== 'odobren')
        return res.status(403).json({ message: 'Account is pending approval' })

      const obj: any = user.toObject()
      delete obj.passwordHash
      return res.json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /users/profile/:id
  getProfile = async (req: express.Request, res: express.Response) => {
    try {
      const user = await UserModel.findById(req.params.id)
      if (!user) return res.status(404).json({ message: 'User not found' })

      const obj: any = user.toObject()
      delete obj.passwordHash
      return res.json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/updateProfile
  updateProfile = async (req: express.Request, res: express.Response) => {
    try {
      const { id, ime, prezime, telefon, email } = req.body
      let { institucija } = req.body
      if (typeof institucija === 'string') {
        try {
          institucija = JSON.parse(institucija)
        } catch {
          institucija = undefined
        }
      }

      if (!id) return res.status(400).json({ message: 'Missing user id' })
      if (!ime || !prezime || !telefon || !email)
        return res.status(400).json({ message: 'Missing required fields' })

      const user = await UserModel.findById(id)
      if (!user) return res.status(404).json({ message: 'User not found' })

      // Email stays unique across users.
      const lowerEmail = email.toLowerCase()
      if (lowerEmail !== user.email) {
        if (await UserModel.findOne({ email: lowerEmail, _id: { $ne: user._id } }))
          return res.status(400).json({ message: 'Email already registered' })
      }

      // Optional new profile image (same rules as registration).
      const file: any = (req as any).file
      if (file) {
        let dim
        try {
          dim = imageSize(file.buffer)
        } catch {
          return res.status(400).json({ message: 'Invalid image file' })
        }
        if (!dim.type || !['jpg', 'png', 'gif'].includes(dim.type))
          return res.status(400).json({ message: 'Profile image must be JPG, PNG or GIF' })
        if (
          !dim.width ||
          !dim.height ||
          dim.width < 100 ||
          dim.height < 100 ||
          dim.width > 250 ||
          dim.height > 250
        )
          return res
            .status(400)
            .json({ message: 'Profile image must be between 100x100 and 250x250 px' })

        const filename = `${randomUUID()}.${dim.type}`
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), file.buffer)
        // Remove the previous image unless it is the shared default.
        if (user.profilna && user.profilna !== 'default_profile_image.jpg') {
          try {
            fs.unlinkSync(path.join(UPLOADS_DIR, user.profilna))
          } catch {
            /* ignore if it is already gone */
          }
        }
        user.profilna = filename
      }

      user.ime = ime
      user.prezime = prezime
      user.telefon = telefon
      user.email = lowerEmail
      // Institution: only the descriptive fields are editable (identifiers stay fixed).
      if (institucija && user.institucija) {
        if (institucija.naziv) user.institucija.naziv = institucija.naziv
        if (institucija.adresaSedista) user.institucija.adresaSedista = institucija.adresaSedista
        if (institucija.grad) user.institucija.grad = institucija.grad
      }

      await user.save()
      const obj: any = user.toObject()
      delete obj.passwordHash
      return res.json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/adminLogin
  adminLogin = async (req: express.Request, res: express.Response) => {
    try {
      const { username, password } = req.body
      if (!username || !password)
        return res.status(400).json({ message: 'Missing credentials' })

      const user = await UserModel.findOne({ username })
      if (!user || !bcrypt.compareSync(password, user.passwordHash))
        return res.status(401).json({ message: 'Invalid username or password' })
      if (user.tip !== 'admin') return res.status(403).json({ message: 'Not an admin' })

      const obj: any = user.toObject()
      delete obj.passwordHash
      return res.json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /users/pending — unapproved registration requests.
  getPending = async (req: express.Request, res: express.Response) => {
    try {
      const users = await UserModel.find({ status: 'neodobren' })
        .select('-passwordHash')
      return res.json(users)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/approve  { id }
  approve = async (req: express.Request, res: express.Response) => {
    try {
      await UserModel.updateOne(
        { _id: req.body.id },
        { status: 'odobren' }
      )
      const user = await UserModel.findOne({ _id: req.body.id })
        .select('-passwordHash')
      if (!user) return res.status(404).json({ message: 'User not found' })
      return res.json(user)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/reject  { id }
  reject = async (req: express.Request, res: express.Response) => {
    try {
      await UserModel.updateOne(
        req.body.id,
        { status: 'odbijen' },
      )
      const user = await UserModel.findOne({ _id : req.body.id })
        .select('-passwordHash')
      if (!user) return res.status(404).json({ message: 'User not found' })
      return res.json(user)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // GET /users/all — every user (management table).
  getAll = async (req: express.Request, res: express.Response) => {
    try {
      const users = await UserModel.find({}).select('-passwordHash')
      return res.json(users)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/adminUpdate
  adminUpdate = async (req: express.Request, res: express.Response) => {
    try {
      const { id, ime, prezime, telefon, email } = req.body
      if (!id) return res.status(400).json({ message: 'Missing user id' })

      const user = await UserModel.findOne({_id: id}).select('-passwordHash')
      if (!user) return res.status(404).json({ message: 'User not found' })

      if (email && email.toLowerCase() !== user.email) {
        const lower = email.toLowerCase()
        if (await UserModel.findOne({ email: lower, _id: { $ne: user._id } }))
          return res.status(400).json({ message: 'Email already registered' })
        user.email = lower
      }
      if (ime) user.ime = ime
      if (prezime) user.prezime = prezime
      if (telefon) user.telefon = telefon

      await user.save()
      const obj: any = user.toObject()
      return res.json(obj)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/delete
  deleteUser = async (req: express.Request, res: express.Response) => {
    try {
      const user = await UserModel.findByIdAndDelete(req.body.id)
      if (!user) return res.status(404).json({ message: 'User not found' })
      return res.sendStatus(200)
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/requestPasswordReset
  requestPasswordReset = async (req: express.Request, res: express.Response) => {
    try {
      const { identifier } = req.body
      if (!identifier)
        return res.status(400).json({ message: 'Unesite korisničko ime ili email' })

      const user = await UserModel.findOne({
        $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
      })

      if (user) {
        const token = randomUUID()
        user.resetToken = token
        user.resetTokenExpires = new Date(Date.now() + env.resetTokenTtlMin * 60 * 1000)
        await user.save()

        const link = `${env.clientUrl}/reset/${token}`
        try {
          await sendPasswordResetEmail(user.email, link)
        } catch (mailErr) {
          console.log('Reset email failed:', mailErr)
        }
      }

      return res.json({
        message: 'Ako nalog postoji, poslat je link za poništavanje lozinke.',
      })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  // POST /users/resetPassword
  resetPassword = async (req: express.Request, res: express.Response) => {
    try {
      const { token, password } = req.body
      if (!token || !password) return res.status(400).json({ message: 'Nedostaju podaci' })

      if (!PASSWORD_REGEX.test(password))
        return res.status(400).json({
          message:
            'Lozinka mora imati 8–12 karaktera, počinjati slovom i sadržati veliko slovo, cifru i specijalni karakter',
        })

      const user = await UserModel.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() },
      })
      if (!user) return res.status(400).json({ message: 'Nevažeći ili zastareo link' })

      user.passwordHash = bcrypt.hashSync(password, 10)
      user.resetToken = undefined
      user.resetTokenExpires = undefined
      await user.save()

      return res.json({ message: 'Lozinka je uspešno promenjena.' })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }
}
